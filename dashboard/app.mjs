// This file will contain the client-side application logic.
// It will fetch data from the /api/data endpoint and render the dashboard.

let decisions = [];
let network = null;

let decisionNetwork = null;
let charterNetwork = null;
let allDecisions = []; // Cache all decisions
let allBacklogItems = []; // Cache all backlog items
let currentSelectedDecisionId = null;

async function initializeDashboard(focusNodeId = null) {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      // Try to get detailed error information from the server
      let errorInfo;
      try {
        errorInfo = await response.json();
      } catch (e) {
        errorInfo = {
          error: "Unknown error",
          message: `Server returned ${response.status}: ${response.statusText}`,
        };
      }
      throw new Error(`${errorInfo.error}: ${errorInfo.message}`);
    }
    const apiData = await response.json();
    const { decisions, backlog, charter } = apiData;

    allDecisions = decisions; // Cache the full list
    allBacklogItems = backlog; // Cache the full list

    renderDecisionLog(allDecisions);

    // Setup Decision Map
    const decisionMap = document.getElementById("decision-map");
    if (decisionMap) {
      const statusColorMapping = { Accepted: "#28a745", Superseded: "#6c757d" };
      const isDark = document.body.classList.contains("dark-theme");
      const fontColor = isDark ? "#fff" : "#000";
      const nodeBg = isDark ? "#000" : "#fff";
      const nodes = decisions.map((d) => ({
        id: d.id,
        label: `${d.quick_task ? '⚡ ' : ''}#${d.id}:\n${d.title}`, // Add lightning bolt for quick tasks
        color: {
          border: statusColorMapping[d.status] || "#007bff",
          background: nodeBg,
          highlight: {
            border: statusColorMapping[d.status] || "#007bff",
            background: nodeBg,
          },
          hover: {
            border: statusColorMapping[d.status] || "#007bff",
            background: nodeBg,
          },
        },
        chosen: {
          node: function (values, id, selected, hovering) {
            // Prevent font changes on selection/hover
            if (!values.font) values.font = {};
            values.font.size = 12;
            values.font.face = "helvetica";
            values.font.vadjust = 0;
            values.font.multi = "html";
          },
        },
        font: {
          color: fontColor,
          size: 12,
          face: "helvetica",
          multi: "html",
          vadjust: 0,
        },
      }));
      const relatedEdges = decisions.flatMap((d) =>
        d.related_to
          ? d.related_to.map((r) => ({
              from: r,
              to: d.id,
              dashes: [5, 5],
              color: "#848484",
            }))
          : [],
      );
      const supersedesEdges = decisions.flatMap((d) =>
        d.supersedes
          ? [
              {
                from: d.id,
                to: d.supersedes,
                dashes: [5, 5],
                color: "#dc3545",
                width: 2,
                label: "supersedes",
              },
            ]
          : [],
      );
      const edges = [...relatedEdges, ...supersedesEdges];
      requestAnimationFrame(() => {
        decisionMap.nodes = nodes;
        decisionMap.edges = edges;
      });
      if (focusNodeId) {
        requestAnimationFrame(() => {
          handleDecisionSelection(focusNodeId, true);
        });
      } else if (currentSelectedDecisionId) {
        requestAnimationFrame(() => {
          handleDecisionSelection(currentSelectedDecisionId, false);
        });
      }
    }

    // Setup Architecture Map
    const architectureMap = document.getElementById("architecture-map");
    if (architectureMap) {
      architectureMap.decisions = decisions;
    }

    // Setup Search Panel
    const searchPanel = document.getElementById("search-controls");
    if (searchPanel) {
      searchPanel.decisions = decisions;
      // Initialize filteredDecisions to show all decisions initially
      searchPanel.filteredDecisions = decisions;
    }

    // Setup Advanced Filter
    const advancedFilter = document.getElementById("advanced-filter");
    if (advancedFilter) {
      advancedFilter.decisions = decisions;
    }

    // Setup Pathway Explorer
    const pathwayExplorer = document.getElementById("pathway-explorer");
    if (pathwayExplorer) {
      pathwayExplorer.decisions = decisions;
    }

    // After loading new data, update the decision detail panel if a decision is currently selected
    if (currentSelectedDecisionId && !focusNodeId) {
      const updatedDecision = allDecisions.find(
        (d) => d.id === currentSelectedDecisionId,
      );
      const detailPanel = document.getElementById("decision-detail");

      if (detailPanel && updatedDecision) {
        // Use the forceUpdateDecision method for better reactivity
        detailPanel.forceUpdateDecision(
          JSON.parse(JSON.stringify(updatedDecision)),
        );
      }
    }

    // Setup Charter Map
    const charterMap = document.getElementById("charter-map");
    if (charterMap) {
      const activeStageId =
        (
          decisions.find((d) =>
            ["Ideating", "Propose", "Implement", "Refine"].includes(d.status),
          ) || {}
        ).status || "Complete";
      charterMap.nodes = charter.states.map((s) => ({
        ...s,
        color: s.id === activeStageId ? "#6f42c1" : "#007bff",
      }));
      charterMap.edges = charter.transitions.map((t) => ({
        ...t,
        arrows: "to",
      }));
    }

    renderBacklog(allBacklogItems);
    renderAnalytics(allDecisions, allBacklogItems);
    setupEventListeners();
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    displayErrorMessage(error.message);
  }

  // Load current agent activities after dashboard loads
  loadCurrentActivities();
}

function displayErrorMessage(message) {
  document.body.innerHTML = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Error Loading Dashboard</h2>
            <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #d32f2f;"><strong>Error:</strong> ${message}</p>
            </div>
            <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 16px;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">💡 Troubleshooting Tips:</h3>
                <ul style="margin: 0; color: #1976d2;">
                    <li>If you see "decisions.yml not found", run <code>decision-tapestry init</code> to create a new file</li>
                    <li>If you see "Invalid YAML syntax", check your YAML file for formatting errors</li>
                    <li>If you see "must be an array", ensure your decisions and backlog are formatted as arrays</li>
                    <li>Check the browser console and server logs for more details</li>
                </ul>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="window.location.reload()" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    🔄 Retry
                </button>
                <button onclick="window.open('/api/health', '_blank')" style="background: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    🔍 Health Check
                </button>
            </div>
        </div>
    `;
}

function renderDecisionLog(decisions) {
  const logPanel = document.getElementById("decision-log-content");
  if (logPanel) {
    logPanel.decisions = decisions;
  }
}

function renderBacklog(backlogItems) {
  const backlogPanel = document.querySelector("product-backlog-panel");
  if (backlogPanel) {
    backlogPanel.backlogItems = backlogItems;
  }
}

function renderAnalytics(decisions, backlog) {
  const healthMetrics = calculateHealthMetrics(decisions);
  const healthMetricsPanel = document.getElementById("health-metrics-stats");
  if (healthMetricsPanel) {
    healthMetricsPanel.totalDecisions = healthMetrics.totalDecisions;
    healthMetricsPanel.averageLifetime = healthMetrics.averageLifetime;
    healthMetricsPanel.supersededCount = healthMetrics.supersededCount;
    healthMetricsPanel.backlogSize = backlog.length;
  }

  const healthChartPanel = document.querySelector("decision-health-chart");
  if (healthChartPanel) {
    healthChartPanel.metrics = healthMetrics;
  }

  const velocityChartPanel = document.querySelector("decision-velocity-chart");
  if (velocityChartPanel) {
    velocityChartPanel.decisions = decisions;
  }
}

function calculateHealthMetrics(decisions) {
  const statusCounts = decisions.reduce((acc, decision) => {
    if (!acc[decision.status]) {
      acc[decision.status] = 0;
    }
    acc[decision.status]++;
    return acc;
  }, {});

  const totalDecisions = decisions.length;
  const totalLifetime = decisions
    .map((decision) => {
      const now = new Date();
      const lifetime = (now - new Date(decision.date)) / (1000 * 60 * 60 * 24); // in days
      return lifetime;
    })
    .reduce((a, b) => a + b, 0);

  const avgLifetimeDays =
    totalDecisions > 0 ? (totalLifetime / totalDecisions).toFixed(1) : 0;

  return {
    totalDecisions,
    supersededCount: statusCounts["Superseded"] || 0,
    averageLifetime: `${avgLifetimeDays} days`,
    statusDistribution: {
      accepted: statusCounts["Accepted"] || 0,
      superseded: statusCounts["Superseded"] || 0,
      deprecated: statusCounts["Deprecated"] || 0,
    },
  };
}

function calculateImpactScore(decision) {
  // Simple impact scoring based on available data
  let score = 0;

  if (decision.affected_components && decision.affected_components.length > 0) {
    score += decision.affected_components.length;
  }

  if (decision.related_to && decision.related_to.length > 0) {
    score += decision.related_to.length;
  }

  if (decision.supersedes) {
    score += 2;
  }

  return Math.min(score, 10); // Cap at 10
}

function inferCategory(decision) {
  const title = decision.title || "";
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("cli") ||
    lowerTitle.includes("automation") ||
    lowerTitle.includes("docker") ||
    lowerTitle.includes("release")
  ) {
    return "Developer Experience";
  } else if (
    lowerTitle.includes("websocket") ||
    lowerTitle.includes("server") ||
    lowerTitle.includes("infrastructure") ||
    lowerTitle.includes("api") ||
    lowerTitle.includes("redis") ||
    lowerTitle.includes("session")
  ) {
    return "Infrastructure";
  } else if (
    lowerTitle.includes("dashboard") ||
    lowerTitle.includes("ui") ||
    lowerTitle.includes("theme") ||
    lowerTitle.includes("visual") ||
    lowerTitle.includes("layout") ||
    lowerTitle.includes("panel")
  ) {
    return "UI/UX";
  } else if (
    lowerTitle.includes("architecture") ||
    lowerTitle.includes("component") ||
    lowerTitle.includes("structure") ||
    lowerTitle.includes("design")
  ) {
    return "Architecture";
  } else if (
    lowerTitle.includes("process") ||
    lowerTitle.includes("workflow") ||
    lowerTitle.includes("coordination") ||
    lowerTitle.includes("collaboration") ||
    lowerTitle.includes("debugging")
  ) {
    return "Process";
  } else if (
    lowerTitle.includes("test") ||
    lowerTitle.includes("quality") ||
    lowerTitle.includes("lint") ||
    lowerTitle.includes("error")
  ) {
    return "Quality";
  } else if (
    lowerTitle.includes("integration") ||
    lowerTitle.includes("vscode") ||
    lowerTitle.includes("extension") ||
    lowerTitle.includes("prompt")
  ) {
    return "Integration";
  } else if (
    lowerTitle.includes("memory") ||
    lowerTitle.includes("knowledge") ||
    lowerTitle.includes("decision") ||
    lowerTitle.includes("tapestry")
  ) {
    return "Knowledge Management";
  }
  return "Other";
}

async function promoteToDecision(backlogId) {
  try {
    const response = await fetch("/api/decisions/promote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: backlogId }),
    });

    if (!response.ok) {
      // Try to get detailed error information from the server
      let errorInfo;
      try {
        errorInfo = await response.json();
      } catch (e) {
        errorInfo = {
          error: "Unknown error",
          message: `Server returned ${response.status}: ${response.statusText}`,
        };
      }
      throw new Error(`${errorInfo.error}: ${errorInfo.message}`);
    }

    // The websocket will trigger a full refresh, so no need to manually update the UI here.
    console.log("Promotion successful, waiting for refresh...");
  } catch (error) {
    console.error("Error promoting backlog item:", error);
    // Re-enable the button on error
    const button = document.querySelector(
      `.backlog-item[data-backlog-id="${backlogId}"] .promote-btn`,
    );
    if (button) {
      button.disabled = false;
      button.textContent = "Promote";
    }

    // Show user-friendly error message
    showErrorToast(error.message);
  }
}

function showErrorToast(message) {
  // Remove any existing toast
  const existingToast = document.getElementById("error-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.id = "error-toast";
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
        animation: slideIn 0.3s ease-out;
    `;

  toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>⚠️</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: auto;">×</button>
        </div>
    `;

  // Add CSS animation
  if (!document.querySelector("#toast-animations")) {
    const style = document.createElement("style");
    style.id = "toast-animations";
    style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

function handleDecisionSelection(decisionId, animate = false) {
  currentSelectedDecisionId = decisionId;
  const decisionMap = document.getElementById("decision-map");
  const architectureMap = document.getElementById("architecture-map");
  const detailPanel = document.getElementById("decision-detail");
  const logPanel = document.getElementById("decision-log-content");
  const decision = allDecisions.find((d) => d.id === decisionId);

  // Update the state of all relevant components
  if (detailPanel)
    detailPanel.decision = decision
      ? JSON.parse(JSON.stringify(decision))
      : null;
  if (logPanel) logPanel.selectedId = decisionId;
  if (decisionMap) decisionMap.selectNode(decisionId);

  // Update Architecture Map - highlight affected components
  if (architectureMap) {
    architectureMap.highlightDecisionImpact(decisionId);
  }

  // If triggered from an interaction that requires camera movement,
  // fire the animation on the next frame.
  if (animate && decisionMap) {
    requestAnimationFrame(() => {
      decisionMap.focusOnNode(decisionId);
    });
  }
}

function switchCenterView(view) {
  // Update tab active states
  const centerTabs = document.querySelectorAll(".center-tab");
  centerTabs.forEach((tab) => {
    if (tab.dataset.view === view) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Update view active states
  const centerViews = document.querySelectorAll(".center-view");
  centerViews.forEach((viewEl) => {
    if (viewEl.dataset.view === view) {
      viewEl.classList.add("active");
    } else {
      viewEl.classList.remove("active");
    }
  });

  // If switching to architecture view, update with current decisions
  if (view === "architecture") {
    const architectureMap = document.getElementById("architecture-map");
    if (architectureMap && allDecisions) {
      architectureMap.decisions = allDecisions;

      // If a decision is currently selected, highlight its impact
      if (currentSelectedDecisionId) {
        setTimeout(() => {
          architectureMap.highlightDecisionImpact(currentSelectedDecisionId);
        }, 100);
      }
    }
  }
}

function switchControlsTab(tab) {
  // Update tab active states
  const controlsTabs = document.querySelectorAll(".controls-tab");
  controlsTabs.forEach((tabEl) => {
    if (tabEl.dataset.tab === tab) {
      tabEl.classList.add("active");
    } else {
      tabEl.classList.remove("active");
    }
  });

  // Update view active states
  const controlsViews = document.querySelectorAll(".controls-view");
  controlsViews.forEach((viewEl) => {
    if (viewEl.dataset.tab === tab) {
      viewEl.classList.add("active");
    } else {
      viewEl.classList.remove("active");
    }
  });
}

function updateDecisionMapWithFiltered(filteredDecisions) {
  const decisionMap = document.getElementById("decision-map");
  if (!decisionMap) return;

  const statusColorMapping = { Accepted: "#28a745", Superseded: "#6c757d" };
  const isDark = document.body.classList.contains("dark-theme");
  const fontColor = isDark ? "#fff" : "#000";
  const nodeBg = isDark ? "#000" : "#fff";

  const nodes = filteredDecisions.map((d) => ({
    id: d.id,
    label: `${d.quick_task ? '⚡ ' : ''}#${d.id}:\n${d.title}`, // Add lightning bolt for quick tasks
    color: {
      border: statusColorMapping[d.status] || "#007bff",
      background: nodeBg,
      highlight: {
        border: statusColorMapping[d.status] || "#007bff",
        background: nodeBg,
      },
      hover: {
        border: statusColorMapping[d.status] || "#007bff",
        background: nodeBg,
      },
    },
    font: {
      color: fontColor,
      size: 12,
      face: "helvetica",
      multi: "html",
      vadjust: 0,
    },
  }));

  const relatedEdges = filteredDecisions.flatMap((d) =>
    d.related_to
      ? d.related_to
          .filter((r) => filteredDecisions.some((fd) => fd.id === r))
          .map((r) => ({ from: r, to: d.id, dashes: [5, 5], color: "#848484" }))
      : [],
  );

  const supersedesEdges = filteredDecisions.flatMap((d) =>
    d.supersedes && filteredDecisions.some((fd) => fd.id === d.supersedes)
      ? [
          {
            from: d.id,
            to: d.supersedes,
            dashes: [5, 5],
            color: "#dc3545",
            width: 2,
            label: "supersedes",
          },
        ]
      : [],
  );

  const edges = [...relatedEdges, ...supersedesEdges];

  requestAnimationFrame(() => {
    decisionMap.nodes = nodes;
    decisionMap.edges = edges;
  });
}

function setupEventListeners() {
  const decisionMap = document.getElementById("decision-map");
  const detailPanel = document.getElementById("decision-detail");
  const logPanel = document.getElementById("decision-log-content");

  // Link Map clicks to Detail and Log panels
  if (decisionMap) {
    decisionMap.addEventListener("node-click", (e) => {
      handleDecisionSelection(e.detail.nodeId, true);
    });
  }

  // Link Log clicks to Detail and Map panels
  if (logPanel) {
    logPanel.addEventListener("log-item-click", (e) => {
      handleDecisionSelection(e.detail.decisionId, true); // Animate
    });
  }

  // Add event listener for tab changes
  const leftPanel = document.getElementById("left-panel");
  if (leftPanel) {
    leftPanel.addEventListener("tab-change", (e) => {
      // Handle new panel-view structure
      const panelViews = leftPanel.querySelectorAll(".panel-view");
      panelViews.forEach((view) => {
        if (view.dataset.tab === e.detail.tabId) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });

      // Handle legacy tab-content for backward compatibility
      const tabContents = leftPanel.querySelectorAll(".tab-content");
      tabContents.forEach((content) => {
        if (content.id === e.detail.tabId) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  }

  // Add event listener for backlog promotion
  const backlogContainer = document.querySelector("product-backlog-panel");
  if (backlogContainer) {
    backlogContainer.addEventListener("promote-click", (e) => {
      promoteToDecision(e.detail.backlogId);
    });
  }

  // Add event listener for search
  const searchPanel = document.getElementById("search-controls");
  if (searchPanel) {
    searchPanel.addEventListener("search-input", (e) => {
      const searchTerm = e.detail.searchTerm.toLowerCase();
      const filteredDecisions = allDecisions.filter(
        (d) =>
          d.title.toLowerCase().includes(searchTerm) ||
          d.id.toString().includes(searchTerm) ||
          (d.author && d.author.toLowerCase().includes(searchTerm)),
      );

      // Update the search panel with filtered data
      searchPanel.filteredDecisions = filteredDecisions;

      // Update the log
      renderDecisionLog(filteredDecisions);
      // Update the map
      updateDecisionMapWithFiltered(filteredDecisions);
      // If a single decision is matched, select it everywhere
      if (filteredDecisions.length === 1) {
        handleDecisionSelection(filteredDecisions[0].id, true); // Animate
      }
    });

    // Add event listener for search panel filter changes
    searchPanel.addEventListener("filter-change", (e) => {
      const { filters } = e.detail;

      // Apply all filters from search panel
      const filteredDecisions = allDecisions.filter((decision) => {
        // Search term filter
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          const matchesSearch =
            decision.title.toLowerCase().includes(searchTerm) ||
            decision.id.toString().includes(searchTerm) ||
            (decision.author &&
              decision.author.toLowerCase().includes(searchTerm));
          if (!matchesSearch) return false;
        }

        // Impact filter
        if (filters.minImpact > 0) {
          const impactScore = calculateImpactScore(decision);
          if (impactScore < filters.minImpact) return false;
        }

        // Days back filter
        if (filters.daysBack > 0) {
          const decisionDate = new Date(decision.date);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - filters.daysBack);
          if (decisionDate < cutoffDate) return false;
        }

        // Commit time range filter
        if (
          filters.commitTimeRange !== undefined &&
          searchPanel.commitTimeRanges &&
          searchPanel.commitTimeRanges[filters.commitTimeRange]
        ) {
          const range = searchPanel.commitTimeRanges[filters.commitTimeRange];

          // Check if decision has any commits in the specified range
          let hasCommitInRange = false;

          // Check last_commit_date
          if (
            decision.date &&
            typeof decision.date === "object" &&
            decision.date.last_commit_date
          ) {
            const commitDate = new Date(decision.date.last_commit_date);
            if (commitDate >= range.start && commitDate <= range.end) {
              hasCommitInRange = true;
            }
          }

          // Check commits in github_metadata
          if (
            !hasCommitInRange &&
            decision.github_metadata?.commits?.length > 0
          ) {
            hasCommitInRange = decision.github_metadata.commits.some(
              (commit) => {
                const commitDate = new Date(commit.date);
                return commitDate >= range.start && commitDate <= range.end;
              },
            );
          }

          if (!hasCommitInRange) return false;
        }

        // Recent file activity filter (based on last commit date) - kept for backward compatibility
        if (filters.recentFileActivity > 0) {
          // Check if decision has Git-derived dates
          if (
            decision.date &&
            typeof decision.date === "object" &&
            decision.date.last_commit_date
          ) {
            const lastCommitDate = new Date(decision.date.last_commit_date);
            const cutoffDate = new Date();
            cutoffDate.setDate(
              cutoffDate.getDate() - filters.recentFileActivity,
            );
            if (lastCommitDate < cutoffDate) return false;
          } else if (decision.github_metadata?.commits?.length > 0) {
            // Fallback to checking commits array
            const commits = decision.github_metadata.commits;
            const mostRecentCommit = commits.reduce((latest, commit) => {
              const commitDate = new Date(commit.date);
              return commitDate > latest ? commitDate : latest;
            }, new Date(0));

            const cutoffDate = new Date();
            cutoffDate.setDate(
              cutoffDate.getDate() - filters.recentFileActivity,
            );
            if (mostRecentCommit < cutoffDate) return false;
          } else {
            // No commit data available, filter out
            return false;
          }
        }

        return true;
      });

      // Update the search panel with filtered data
      searchPanel.filteredDecisions = filteredDecisions;

      // Update the log and map
      renderDecisionLog(filteredDecisions);
      updateDecisionMapWithFiltered(filteredDecisions);
    });

    // Add event listener for category filtering
    searchPanel.addEventListener("category-filter", (e) => {
      const { category } = e.detail;

      // Toggle the category in advanced filters
      if (advancedFilter) {
        advancedFilter._toggleCategory(category);
        // The advanced filter will emit its own filter-changed event
        // which will handle the actual filtering
      }
    });

    // Add event listener for status filtering
    searchPanel.addEventListener("status-filter", (e) => {
      const { status } = e.detail;
      const filteredDecisions = allDecisions.filter((d) => d.status === status);

      // Update the search panel with filtered data
      searchPanel.filteredDecisions = filteredDecisions;

      // Update the log and map
      renderDecisionLog(filteredDecisions);
      updateDecisionMapWithFiltered(filteredDecisions);
    });

    // Add event listeners for clustering controls
    searchPanel.addEventListener("clustering-toggle", (e) => {
      const decisionMap = document.getElementById("decision-map");
      if (decisionMap) {
        if (e.detail.enabled) {
          decisionMap.enableCategoryClustering();
        } else {
          decisionMap.disableClustering();
        }
      }
    });

    searchPanel.addEventListener("view-change", (e) => {
      const view = e.detail.view;
      const decisionMap = document.getElementById("decision-map");

      if (decisionMap) {
        // First disable any existing clustering
        decisionMap.disableClustering();

        if (view === "category") {
          decisionMap.enableCategoryClustering();
        } else if (view === "architecture") {
          // TODO: Implement architecture clustering in Phase 2
          console.log("Architecture view not yet implemented");
        } else {
          // Flat view - clustering already disabled
        }
      }
    });
  }

  // Add event listeners for center panel tabs
  const centerTabs = document.querySelectorAll(".center-tab");
  if (centerTabs.length > 0) {
    centerTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const targetView = e.target.dataset.view;
        switchCenterView(targetView);
      });
    });
  }

  // Add event listeners for controls panel tabs
  const controlsTabs = document.querySelectorAll(".controls-tab");
  if (controlsTabs.length > 0) {
    controlsTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const targetTab = e.target.dataset.tab;
        switchControlsTab(targetTab);
      });
    });
  }

  // Add event listeners for architecture map
  const architectureMap = document.getElementById("architecture-map");
  if (architectureMap) {
    architectureMap.addEventListener("component-click", (e) => {
      const componentId = e.detail.componentId;
      console.log("Architecture component clicked:", componentId);

      // Find decisions that affect this component
      const affectingDecisions = allDecisions.filter(
        (d) =>
          d.affected_components && d.affected_components.includes(componentId),
      );

      if (affectingDecisions.length > 0) {
        // Switch back to decisions view and select the first affecting decision
        switchCenterView("decisions");
        handleDecisionSelection(affectingDecisions[0].id, true);
      }
    });
  }

  // Add event listeners for new Phase 3 components
  const advancedFilter = document.getElementById("advanced-filter");
  if (advancedFilter) {
    advancedFilter.addEventListener("filter-change", (e) => {
      const { filteredDecisions, filters } = e.detail;

      // Update decision log with filtered results
      renderDecisionLog(filteredDecisions);

      // Update decision map with filtered results
      const decisionMap = document.getElementById("decision-map");
      if (decisionMap) {
        updateDecisionMapWithFiltered(filteredDecisions);
      }

      // Update architecture map
      const architectureMap = document.getElementById("architecture-map");
      if (architectureMap) {
        architectureMap.decisions = filteredDecisions;
      }

      // Update search panel with active filters
      const searchPanel = document.getElementById("search-controls");
      if (searchPanel) {
        searchPanel.activeFilters = {
          categories: filters.categories || [],
          statuses: filters.statuses || [],
        };
      }
    });
  }

  const pathwayExplorer = document.getElementById("pathway-explorer");
  if (pathwayExplorer) {
    pathwayExplorer.addEventListener("pathway-click", (e) => {
      const { pathway } = e.detail;

      // Highlight pathway decisions in the map
      const decisionMap = document.getElementById("decision-map");
      if (decisionMap) {
        pathway.decisions.forEach((decision, index) => {
          setTimeout(() => {
            decisionMap.selectNode(decision.id);
            if (index === 0) {
              decisionMap.focusOnNode(decision.id);
            }
          }, index * 500);
        });
      }
    });

    pathwayExplorer.addEventListener("decision-select", (e) => {
      const { decisionId } = e.detail;
      handleDecisionSelection(decisionId, true);
    });
  }

  // Add event listeners for activity component events
  document.addEventListener("decision-focus", (e) => {
    const decisionId = e.detail.decisionId;
    if (decisionId) {
      handleDecisionSelection(decisionId, true); // Animate to decision
    }
  });

  document.addEventListener("agent-click", (e) => {
    console.log("Agent clicked:", e.detail);
    // Could be extended to show agent details or filter by agent
  });
}

async function loadCurrentActivities() {
  try {
    const response = await fetch("/api/activity");
    const data = await response.json();

    console.log("Loading current activities:", data.activities);

    // Restore visual states for all active agents
    data.activities.forEach((activity) => {
      if (activity.state !== "idle" && activity.decisionId) {
        // Check if the decision exists before restoring activity
        const decision = allDecisions.find((d) => d.id === activity.decisionId);
        if (decision) {
          handleActivityUpdate({
            agentId: activity.agentId,
            activity: {
              state: activity.state,
              decisionId: activity.decisionId,
              taskDescription: activity.taskDescription,
            },
            timestamp: activity.lastUpdate,
          });
        } else {
          console.warn(
            `[Activity] Skipping restore for decision ${activity.decisionId} - not found in current decisions`,
          );
        }
      }
    });
  } catch (error) {
    console.warn("Could not load current activities:", error);
  }
}

function handleActivityUpdate(message) {
  console.log(
    `[Activity] ${message.agentId} -> ${message.activity.state} on decision ${message.activity.decisionId}`,
  );

  // Update decision map with activity indicators if the activity is linked to a decision
  if (message.activity.decisionId) {
    const decisionMap = document.getElementById("decision-map");
    if (decisionMap && decisionMap.updateNodeActivity) {
      // Use the new updateNodeActivity method
      decisionMap.updateNodeActivity(
        message.activity.decisionId,
        message.agentId,
        message.activity.state,
      );
    }

    // Don't auto-select decisions anymore - just update the visual state
    if (message.activity.state !== "idle") {
      // Check if the decision exists before updating visual state
      const decision = allDecisions.find(
        (d) => d.id === message.activity.decisionId,
      );
      if (decision) {
        console.log(
          `[Activity] Agent ${message.agentId} working on decision ${message.activity.decisionId}`,
        );
        // Visual updates will be handled by the decision map component
      } else {
        console.warn(
          `[Activity] Decision ${message.activity.decisionId} not found in current decisions`,
        );
      }
    }

    // Update decision details panel if this decision is currently selected
    const detailPanel = document.getElementById("decision-detail");
    if (
      detailPanel &&
      detailPanel.decision &&
      detailPanel.decision.id === message.activity.decisionId
    ) {
      detailPanel.updateActivity(
        message.agentId,
        message.activity.state,
        message.activity.taskDescription,
      );
    }

    // Update decision log with activity badge
    const logPanel = document.getElementById("decision-log-content");
    if (logPanel && logPanel.updateDecisionActivity) {
      logPanel.updateDecisionActivity(
        message.activity.decisionId,
        message.agentId,
        message.activity.state,
        message.activity.taskDescription,
      );
    }
  }

  // Update agent status panel if it exists (currently only in test-components.html)
  // const agentStatusPanel = document.querySelector("agent-status-panel");
  // if (agentStatusPanel && agentStatusPanel.updateAgentActivity) {
  //   agentStatusPanel.updateAgentActivity(message.agentId, message.activity);
  // }

  // Also check for agent status panel inside agent-test-panel
  const agentTestPanel = document.querySelector("agent-test-panel");
  if (agentTestPanel) {
    const nestedAgentStatus =
      agentTestPanel.shadowRoot?.querySelector("#agent-status");
    if (nestedAgentStatus && nestedAgentStatus.updateAgentActivity) {
      nestedAgentStatus.updateAgentActivity(message.agentId, message.activity);
    }
  }

  // Update activity timeline if it exists
  const activityTimeline = document.querySelector("activity-timeline");
  if (activityTimeline && activityTimeline.addActivity) {
    activityTimeline.addActivity({
      agentId: message.agentId,
      activity: message.activity,
      timestamp: message.timestamp || new Date().toISOString(),
    });
  }
}

function handleActivityReset() {
  console.log("[Activity] Resetting all agent activities across panels");

  // Clear decision map activities
  const decisionMap = document.getElementById("decision-map");
  console.log("[Activity] Decision map found:", !!decisionMap);
  console.log(
    "[Activity] Decision map has clearAllActivities:",
    !!decisionMap?.clearAllActivities,
  );
  if (decisionMap && decisionMap.clearAllActivities) {
    decisionMap.clearAllActivities();
  }

  // Clear agent status panel (currently only in test-components.html)
  // const agentStatusPanel = document.querySelector("agent-status-panel");
  // if (agentStatusPanel && agentStatusPanel.clearAllAgents) {
  //   agentStatusPanel.clearAllAgents();
  // }

  // Clear agent status panel inside agent-test-panel
  const agentTestPanel = document.querySelector("agent-test-panel");
  if (agentTestPanel) {
    const nestedAgentStatus =
      agentTestPanel.shadowRoot?.querySelector("#agent-status");
    if (nestedAgentStatus && nestedAgentStatus.clearAllAgents) {
      nestedAgentStatus.clearAllAgents();
    }
  }

  // Clear activity timeline
  const activityTimeline = document.querySelector("activity-timeline");
  if (activityTimeline && activityTimeline.clearActivities) {
    activityTimeline.clearActivities();
  }

  // Agent activity feed component was deprecated and removed

  // Clear decision detail panel
  const detailPanel = document.getElementById("decision-detail");
  if (detailPanel && detailPanel.clearActivity) {
    detailPanel.clearActivity();
  }

  // Clear decision log panel
  const logPanel = document.getElementById("decision-log-content");
  if (logPanel && logPanel.clearAllActivities) {
    logPanel.clearAllActivities();
  }
}

/**
 * Check if a WebSocket message is an agent coordination message
 */
function isAgentCoordinationMessage(message) {
  const agentMessageTypes = [
    'agent_register',
    'agent_status', 
    'agent_heartbeat',
    'task_completion',
    'decision_update',
    'agent_error',
    'agent_disconnected',
    'agent_status_list',
    'agent_status_response'
  ];
  
  return agentMessageTypes.includes(message.type);
}

/**
 * Handle agent coordination messages by forwarding them to the agent status panel
 */
function handleAgentCoordinationMessage(message) {
  console.log('[App] Forwarding agent coordination message:', message.type, message);
  
  // Forward to agent status panel if present (currently only in test-components.html)
  // const agentStatusPanel = document.querySelector('agent-status-panel');
  // if (agentStatusPanel && typeof agentStatusPanel.handleWebSocketMessage === 'function') {
  //   agentStatusPanel.handleWebSocketMessage(message);
  // } else {
  //   console.warn('[App] Agent status panel not found or not ready for coordination messages');
  // }
}

function initializeWebSocket() {
  let socket;
  let reconnectTimeout;

  function connect() {
    socket = new WebSocket(`ws://${window.location.host}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      initializeDashboard(); // Always refresh data on (re)connect
    };
    socket.onclose = () => {
      console.log("WebSocket connection closed, retrying in 1s...");
      reconnectTimeout = setTimeout(connect, 1000);
    };
    socket.onerror = (error) => console.error("WebSocket error:", error);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "update") {
          console.log("File change detected, refreshing dashboard...");
          initializeDashboard(message.decisionId); // focus on the updated node if available
        } else if (message.type === "activity") {
          handleActivityUpdate(message);
        } else if (message.type === "activity-reset") {
          console.log("Received activity-reset message:", message);
          handleActivityReset();
        } else if (isAgentCoordinationMessage(message)) {
          // Forward agent coordination messages to the agent status panel
          handleAgentCoordinationMessage(message);
          
          // If it's a decision update, also reload the dashboard
          if (message.type === "decision_update") {
            console.log("Decision updated by agent, reloading...");
            initializeDashboard(message.decisionId);
          }
        } else if (message.type === "canvas-update") {
          // Dispatch canvas update to AI Canvas component
          const canvasEvent = new CustomEvent('canvas-update', { 
            detail: message.data 
          });
          window.dispatchEvent(canvasEvent);
          console.log("AI Canvas update received:", message.data.type);
        } else {
          console.log("Unknown WebSocket message type:", message.type);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };
  }

  connect();
}

// --- THEME TOGGLE LOGIC ---
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark-theme");
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.textContent = "🌙";
  }
}

function getPreferredTheme() {
  const saved = localStorage.getItem("dt-theme");
  if (saved) return saved;
  // Fallback to system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  let currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  btn.addEventListener("click", () => {
    currentTheme = document.body.classList.contains("dark-theme")
      ? "light"
      : "dark";
    localStorage.setItem("dt-theme", currentTheme);
    applyTheme(currentTheme);
  });
}

// --- END THEME TOGGLE LOGIC ---

window.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  initializeDashboard();
  setupEventListeners();
  initializeWebSocket();
  // Re-render nodes on theme change
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      // Re-run initializeDashboard to update node font color
      initializeDashboard();
    });
  }
});

// Expose functions globally for testing
window.handleActivityUpdate = handleActivityUpdate;
window.handleActivityReset = handleActivityReset;
