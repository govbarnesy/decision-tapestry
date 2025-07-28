/**
 * GitHub Projects v2 GraphQL Queries
 * 
 * This module provides GraphQL queries for interacting with GitHub Projects v2
 * to organize and visualize architectural decisions.
 */

export const projectQueries = {
  /**
   * Get project details and all decision items
   */
  getProjectWithDecisions: `
    query GetProjectDecisions($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        projectV2(number: $number) {
          id
          title
          shortDescription
          readme
          url
          closed
          public
          fields(first: 50) {
            nodes {
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                  color
                }
              }
              ... on ProjectV2IterationField {
                id
                name
                configuration {
                  duration
                  startDay
                  iterations {
                    id
                    title
                    startDate
                    duration
                  }
                }
              }
            }
          }
          items(first: 100) {
            nodes {
              id
              databaseId
              content {
                ... on Issue {
                  id
                  number
                  title
                  body
                  state
                  stateReason
                  url
                  createdAt
                  updatedAt
                  closedAt
                  author {
                    login
                    avatarUrl
                    url
                  }
                  assignees(first: 10) {
                    nodes {
                      login
                      avatarUrl
                    }
                  }
                  labels(first: 20) {
                    nodes {
                      name
                      color
                      description
                    }
                  }
                  milestone {
                    title
                    dueOn
                    progressPercentage
                  }
                  projectItems(first: 5) {
                    nodes {
                      project {
                        title
                        number
                      }
                    }
                  }
                  timelineItems(first: 30, itemTypes: [CONNECTED_EVENT, CROSS_REFERENCED_EVENT]) {
                    nodes {
                      ... on ConnectedEvent {
                        subject {
                          ... on PullRequest {
                            number
                            title
                            state
                            url
                          }
                        }
                      }
                      ... on CrossReferencedEvent {
                        source {
                          ... on Issue {
                            number
                            title
                          }
                          ... on PullRequest {
                            number
                            title
                            state
                          }
                        }
                      }
                    }
                  }
                  comments {
                    totalCount
                  }
                  reactions {
                    totalCount
                  }
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    number
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    color
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    title
                    startDate
                    duration
                    field {
                      ... on ProjectV2IterationField {
                        name
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
          views(first: 10) {
            nodes {
              id
              name
              number
              layout
              filter
              sortBy {
                direction
                field {
                  ... on ProjectV2Field {
                    name
                  }
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
              groupBy {
                field {
                  ... on ProjectV2Field {
                    name
                  }
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `,

  /**
   * Get all projects in a repository
   */
  listRepositoryProjects: `
    query ListProjects($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            id
            number
            title
            shortDescription
            url
            closed
            public
            createdAt
            updatedAt
            creator {
              login
              avatarUrl
            }
            items {
              totalCount
            }
          }
          totalCount
        }
      }
    }
  `,

  /**
   * Get decision-related activity
   */
  getDecisionActivity: `
    query GetDecisionActivity($owner: String!, $repo: String!, $issueNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issueNumber) {
          timelineItems(first: 100) {
            nodes {
              __typename
              ... on IssueComment {
                author {
                  login
                  avatarUrl
                }
                body
                createdAt
              }
              ... on CrossReferencedEvent {
                createdAt
                source {
                  ... on PullRequest {
                    number
                    title
                    state
                    url
                    author {
                      login
                    }
                    files(first: 100) {
                      nodes {
                        path
                        additions
                        deletions
                        changeType
                      }
                    }
                  }
                }
              }
              ... on ConnectedEvent {
                createdAt
                subject {
                  ... on PullRequest {
                    number
                    title
                    state
                    url
                  }
                }
              }
              ... on LabeledEvent {
                createdAt
                label {
                  name
                  color
                }
                actor {
                  login
                }
              }
              ... on ClosedEvent {
                createdAt
                actor {
                  login
                }
                stateReason
              }
              ... on ReopenedEvent {
                createdAt
                actor {
                  login
                }
              }
              ... on AssignedEvent {
                createdAt
                assignee {
                  ... on User {
                    login
                  }
                }
                actor {
                  login
                }
              }
            }
          }
        }
      }
    }
  `,

  /**
   * Search for decisions across repositories
   */
  searchDecisions: `
    query SearchDecisions($query: String!, $first: Int = 100) {
      search(query: $query, type: ISSUE, first: $first) {
        issueCount
        nodes {
          ... on Issue {
            id
            number
            title
            body
            state
            url
            createdAt
            updatedAt
            repository {
              name
              owner {
                login
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,

  /**
   * Get PR details for decision implementation
   */
  getDecisionPRs: `
    query GetDecisionPRs($owner: String!, $repo: String!, $decisionNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: 100, states: [OPEN, MERGED, CLOSED]) {
          nodes {
            number
            title
            state
            url
            createdAt
            mergedAt
            closedAt
            author {
              login
              avatarUrl
            }
            body
            files(first: 100) {
              totalCount
              nodes {
                path
                additions
                deletions
                changeType
              }
            }
            reviews(first: 10) {
              totalCount
              nodes {
                state
                author {
                  login
                }
              }
            }
            commits {
              totalCount
            }
          }
        }
      }
    }
  `,

  /**
   * Get repository insights for decision impact
   */
  getRepositoryInsights: `
    query GetRepoInsights($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1) {
                totalCount
              }
            }
          }
        }
        issues(states: [OPEN, CLOSED], labels: ["decision"]) {
          totalCount
        }
        pullRequests {
          totalCount
        }
        collaborators {
          totalCount
        }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            node {
              name
              color
            }
            size
          }
        }
        diskUsage
        stargazerCount
        forkCount
      }
    }
  `
};

/**
 * Helper function to build decision search query
 */
export function buildDecisionSearchQuery(options = {}) {
  const parts = ['label:decision', 'label:architecture'];
  
  if (options.repo) {
    parts.push(`repo:${options.repo}`);
  }
  
  if (options.status) {
    parts.push(`label:${options.status.toLowerCase()}`);
  }
  
  if (options.author) {
    parts.push(`author:${options.author}`);
  }
  
  if (options.text) {
    parts.push(options.text);
  }
  
  if (options.state) {
    parts.push(`state:${options.state}`);
  }
  
  return parts.join(' ');
}