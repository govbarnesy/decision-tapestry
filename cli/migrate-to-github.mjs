#!/usr/bin/env node

/**
 * Migration tool to convert decisions.yml to GitHub Issues
 * 
 * This tool reads the existing decisions.yml file and creates corresponding
 * GitHub issues using the new decision template format.
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { GitHubDecisionsAPI } from '../services/github-decisions-api.mjs';
import { Octokit } from "@octokit/rest";
import chalk from 'chalk';
import { confirm, input, select } from '@inquirer/prompts';

class DecisionMigrator {
  constructor() {
    this.api = null;
    this.decisionsPath = path.join(process.cwd(), 'decisions.yml');
    this.mappingPath = path.join(process.cwd(), '.github-decision-mapping.json');
    this.mapping = {};
  }

  async init() {
    console.log(chalk.bold('\n🚀 Decision Tapestry Migration Tool\n'));
    console.log('This tool will migrate your local decisions.yml to GitHub Issues.\n');

    // Get GitHub credentials
    const token = await input({
      message: 'GitHub Personal Access Token (with repo and project permissions):',
      validate: (value) => value.length > 0 || 'Token is required'
    });

    // Get repository info
    const repoUrl = await input({
      message: 'GitHub repository (owner/repo):',
      default: await this.detectRepo(),
      validate: (value) => /^[^\/]+\/[^\/]+$/.test(value) || 'Format must be owner/repo'
    });

    const [owner, repo] = repoUrl.split('/');
    this.api = new GitHubDecisionsAPI(token, owner, repo);
    
    // Test connection
    try {
      const octokit = new Octokit({ auth: token });
      await octokit.repos.get({ owner, repo });
      console.log(chalk.green(`✓ Connected to ${owner}/${repo}\n`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to connect to repository:', error.message));
      process.exit(1);
    }
  }

  async detectRepo() {
    try {
      const gitConfig = await fs.readFile('.git/config', 'utf-8');
      const match = gitConfig.match(/github\.com[:/]([^/]+\/[^/.]+)/);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }

  async loadDecisions() {
    try {
      const content = await fs.readFile(this.decisionsPath, 'utf-8');
      const data = yaml.load(content);
      return data.decisions || [];
    } catch (error) {
      console.error(chalk.red('Failed to load decisions.yml:', error.message));
      process.exit(1);
    }
  }

  async loadMapping() {
    try {
      const content = await fs.readFile(this.mappingPath, 'utf-8');
      this.mapping = JSON.parse(content);
    } catch {
      // No existing mapping file
      this.mapping = {};
    }
  }

  async saveMapping() {
    await fs.writeFile(this.mappingPath, JSON.stringify(this.mapping, null, 2));
  }

  formatDecisionForGitHub(decision) {
    const sections = [];
    
    // Format the main decision content
    sections.push('## Context');
    if (decision.rationale) {
      sections.push(Array.isArray(decision.rationale) 
        ? decision.rationale.join('\n\n')
        : decision.rationale);
    }
    
    sections.push('\n## Decision');
    sections.push(decision.title || 'No decision text provided');
    
    if (decision.rationale) {
      sections.push('\n## Rationale');
      const rationale = Array.isArray(decision.rationale) 
        ? decision.rationale.map(r => `- ${r}`).join('\n')
        : `- ${decision.rationale}`;
      sections.push(rationale);
    }
    
    if (decision.tradeoffs) {
      sections.push('\n## Tradeoffs');
      const tradeoffs = Array.isArray(decision.tradeoffs)
        ? decision.tradeoffs.map(t => `- ${t}`).join('\n')
        : `- ${decision.tradeoffs}`;
      sections.push(tradeoffs);
    }
    
    if (decision.alternatives) {
      sections.push('\n## Alternatives Considered');
      const alternatives = Array.isArray(decision.alternatives)
        ? decision.alternatives.map(a => `- ${a}`).join('\n')
        : `- ${decision.alternatives}`;
      sections.push(alternatives);
    }
    
    if (decision.consequences) {
      sections.push('\n## Consequences');
      const consequences = Array.isArray(decision.consequences)
        ? decision.consequences.map(c => `- ${c}`).join('\n')
        : `- ${decision.consequences}`;
      sections.push(consequences);
    }
    
    if (decision.affected_components) {
      sections.push('\n## Affected Components');
      const components = Array.isArray(decision.affected_components)
        ? decision.affected_components.map(c => `- ${c}`).join('\n')
        : `- ${decision.affected_components}`;
      sections.push(components);
    }
    
    if (decision.tasks) {
      sections.push('\n## Implementation Tasks');
      const tasks = decision.tasks.map(task => {
        const status = task.status === 'Completed' ? 'x' : ' ';
        return `- [${status}] ${task.description}`;
      }).join('\n');
      sections.push(tasks);
    }
    
    // Add metadata section
    sections.push('\n---');
    sections.push(`\n_Migrated from Decision #${decision.id}_`);
    
    if (decision.date) {
      const dateStr = typeof decision.date === 'object' 
        ? decision.date.decision_date 
        : decision.date;
      sections.push(`_Original date: ${dateStr}_`);
    }
    
    if (decision.author) {
      const authorStr = typeof decision.author === 'object'
        ? decision.author.name || decision.author.git_username
        : decision.author;
      sections.push(`_Original author: ${authorStr}_`);
    }
    
    return sections.join('\n');
  }

  async migrateDecision(decision, dryRun = false) {
    const title = `[Decision] ${decision.title}`;
    const body = this.formatDecisionForGitHub(decision);
    
    // Determine labels
    const labels = ['decision', 'architecture'];
    if (decision.status) {
      labels.push(decision.status.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (dryRun) {
      console.log(chalk.yellow('\n--- DRY RUN ---'));
      console.log(chalk.bold('Title:'), title);
      console.log(chalk.bold('Labels:'), labels.join(', '));
      console.log(chalk.bold('Body:'));
      console.log(body);
      console.log(chalk.yellow('--- END DRY RUN ---\n'));
      return null;
    }
    
    try {
      const issue = await this.api.createDecision({
        title: decision.title,
        context: decision.rationale ? 
          (Array.isArray(decision.rationale) ? decision.rationale.join('\n\n') : decision.rationale) : '',
        decision: decision.title,
        rationale: decision.rationale || [],
        tradeoffs: decision.tradeoffs || [],
        alternatives: decision.alternatives || [],
        consequences: decision.consequences || [],
        affected_components: decision.affected_components || [],
        tasks: decision.tasks || [],
        status: decision.status || 'Proposed'
      });
      
      // Save mapping of old ID to new issue number
      this.mapping[decision.id] = issue.id;
      
      return issue;
    } catch (error) {
      console.error(chalk.red(`Failed to create issue for decision #${decision.id}:`, error.message));
      return null;
    }
  }

  async updateReferences(decisions) {
    console.log(chalk.bold('\n📝 Updating decision references...\n'));
    
    for (const decision of decisions) {
      const newId = this.mapping[decision.id];
      if (!newId) continue;
      
      // Find decisions that reference this one
      const referencingDecisions = decisions.filter(d => {
        const refs = d.related_decisions || [];
        return refs.includes(decision.id);
      });
      
      for (const refDecision of referencingDecisions) {
        const refNewId = this.mapping[refDecision.id];
        if (!refNewId) continue;
        
        try {
          // Update the issue body to include new references
          const issue = await this.api.getDecision(refNewId);
          const updatedRefs = (refDecision.related_decisions || [])
            .map(id => this.mapping[id] || id)
            .map(id => `#${id}`)
            .join(', ');
          
          // This would require updating the issue body
          console.log(chalk.gray(`  Would update decision #${refNewId} to reference #${newId}`));
        } catch (error) {
          console.error(chalk.red(`  Failed to update references for #${refNewId}`));
        }
      }
    }
  }

  async run() {
    await this.init();
    await this.loadMapping();
    
    const decisions = await this.loadDecisions();
    console.log(chalk.bold(`Found ${decisions.length} decisions to migrate\n`));
    
    // Check for existing mapping
    const mapped = Object.keys(this.mapping).length;
    if (mapped > 0) {
      console.log(chalk.yellow(`⚠️  Found existing mapping for ${mapped} decisions`));
      const resume = await confirm({
        message: 'Resume from previous migration?',
        default: true
      });
      
      if (!resume) {
        this.mapping = {};
      }
    }
    
    // Migration options
    const mode = await select({
      message: 'Migration mode:',
      choices: [
        { value: 'all', name: 'Migrate all decisions' },
        { value: 'new', name: 'Migrate only unmapped decisions' },
        { value: 'dry', name: 'Dry run (preview without creating issues)' },
        { value: 'single', name: 'Migrate a single decision' }
      ]
    });
    
    let toMigrate = decisions;
    
    if (mode === 'new') {
      toMigrate = decisions.filter(d => !this.mapping[d.id]);
    } else if (mode === 'single') {
      const decisionId = await input({
        message: 'Decision ID to migrate:',
        validate: (value) => {
          const id = parseInt(value);
          return decisions.some(d => d.id === id) || 'Decision not found';
        }
      });
      toMigrate = decisions.filter(d => d.id === parseInt(decisionId));
    }
    
    const dryRun = mode === 'dry';
    
    console.log(chalk.bold(`\n🔄 Migrating ${toMigrate.length} decisions...\n`));
    
    // Migrate decisions
    for (const decision of toMigrate) {
      console.log(chalk.blue(`Migrating decision #${decision.id}: ${decision.title}`));
      
      if (this.mapping[decision.id]) {
        console.log(chalk.gray(`  Already migrated as issue #${this.mapping[decision.id]}`));
        continue;
      }
      
      const issue = await this.migrateDecision(decision, dryRun);
      
      if (issue) {
        console.log(chalk.green(`  ✓ Created issue #${issue.id}`));
        await this.saveMapping();
      } else if (!dryRun) {
        console.log(chalk.red(`  ✗ Failed to create issue`));
      }
      
      // Rate limit pause
      if (!dryRun) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!dryRun && mode !== 'dry') {
      // Update references
      await this.updateReferences(decisions);
      
      // Final summary
      console.log(chalk.bold('\n✅ Migration complete!\n'));
      console.log(chalk.green(`Migrated ${Object.keys(this.mapping).length} decisions`));
      console.log(chalk.gray(`Mapping saved to ${this.mappingPath}`));
      
      // Next steps
      console.log(chalk.bold('\n📋 Next steps:'));
      console.log('1. Review created issues on GitHub');
      console.log('2. Set up GitHub Project for decision tracking');
      console.log('3. Update your CI/CD to use GitHub Issues instead of decisions.yml');
      console.log('4. Consider archiving decisions.yml after verification');
    }
  }
}

// Run the migrator
const migrator = new DecisionMigrator();
migrator.run().catch(error => {
  console.error(chalk.red('\n❌ Migration failed:'), error);
  process.exit(1);
});