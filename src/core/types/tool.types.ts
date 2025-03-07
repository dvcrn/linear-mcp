/**
 * This file contains the schema definitions for all MCP tools exposed by the Linear server.
 * These schemas define the input parameters and validation rules for each tool.
 */

export const toolSchemas = {
  linear_auth: {
    name: "linear_auth",
    description: "Initialize OAuth flow with Linear",
    inputSchema: {
      type: "object",
      properties: {
        clientId: {
          type: "string",
          description: "Linear OAuth client ID",
        },
        clientSecret: {
          type: "string",
          description: "Linear OAuth client secret",
        },
        redirectUri: {
          type: "string",
          description: "OAuth redirect URI",
        },
      },
      required: ["clientId", "clientSecret", "redirectUri"],
    },
  },

  linear_auth_callback: {
    name: "linear_auth_callback",
    description: "Handle OAuth callback",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "OAuth authorization code",
        },
      },
      required: ["code"],
    },
  },

  linear_create_issue: {
    name: "linear_create_issue",
    description: "Create a new issue in Linear",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Issue title",
        },
        description: {
          type: "string",
          description: "Issue description",
        },
        teamId: {
          type: "string",
          description: "Team ID",
        },
        assigneeId: {
          type: "string",
          description: "Assignee user ID",
          optional: true,
        },
        priority: {
          type: "number",
          description: "Issue priority (0-4)",
          optional: true,
        },
        createAsUser: {
          type: "string",
          description: "Name to display for the created issue",
          optional: true,
        },
        displayIconUrl: {
          type: "string",
          description: "URL of the avatar to display",
          optional: true,
        },
      },
      required: ["title", "description", "teamId"],
    },
  },

  linear_create_project_with_issues: {
    name: "linear_create_project_with_issues",
    description:
      "Create a new project with associated issues. Note: Project requires teamIds (array) not teamId (single value).",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Project name",
            },
            description: {
              type: "string",
              description: "Project description (optional)",
            },
            teamIds: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Array of team IDs this project belongs to (Required). Use linear_get_teams to get available team IDs.",
              minItems: 1,
            },
          },
          required: ["name", "teamIds"],
        },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Issue title",
              },
              description: {
                type: "string",
                description: "Issue description",
              },
              teamId: {
                type: "string",
                description: "Team ID (must match one of the project teamIds)",
              },
            },
            required: ["title", "description", "teamId"],
          },
          description: "List of issues to create with this project",
        },
      },
      required: ["project", "issues"],
    },
    examples: [
      {
        description: "Create a project with a single team and issue",
        value: {
          project: {
            name: "Q1 Planning",
            description: "Q1 2025 Planning Project",
            teamIds: ["team-id-1"],
          },
          issues: [
            {
              title: "Project Setup",
              description: "Initial project setup tasks",
              teamId: "team-id-1",
            },
          ],
        },
      },
      {
        description: "Create a project with multiple teams",
        value: {
          project: {
            name: "Cross-team Initiative",
            description: "Project spanning multiple teams",
            teamIds: ["team-id-1", "team-id-2"],
          },
          issues: [
            {
              title: "Team 1 Tasks",
              description: "Tasks for team 1",
              teamId: "team-id-1",
            },
            {
              title: "Team 2 Tasks",
              description: "Tasks for team 2",
              teamId: "team-id-2",
            },
          ],
        },
      },
    ],
  },

  linear_bulk_update_issues: {
    name: "linear_bulk_update_issues",
    description: "Update multiple issues at once",
    inputSchema: {
      type: "object",
      properties: {
        issueIds: {
          type: "array",
          items: {
            type: "string",
          },
          description: "List of issue IDs to update",
        },
        update: {
          type: "object",
          properties: {
            stateId: {
              type: "string",
              description: "New state ID",
              optional: true,
            },
            assigneeId: {
              type: "string",
              description: "New assignee ID",
              optional: true,
            },
            priority: {
              type: "number",
              description: "New priority (0-4)",
              optional: true,
            },
          },
        },
      },
      required: ["issueIds", "update"],
    },
  },

  linear_search_issues: {
    name: "linear_search_issues",
    description: "Search for issues with filtering and pagination",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
          optional: true,
        },
        teamIds: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Filter by team IDs",
          optional: true,
        },
        assigneeIds: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Filter by assignee IDs",
          optional: true,
        },
        states: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Filter by state names",
          optional: true,
        },
        priority: {
          type: "number",
          description: "Filter by priority (0-4)",
          optional: true,
        },
        first: {
          type: "number",
          description: "Number of issues to return (default: 50)",
          optional: true,
        },
        after: {
          type: "string",
          description: "Cursor for pagination",
          optional: true,
        },
        orderBy: {
          type: "string",
          description: "Field to order by (default: updatedAt)",
          optional: true,
        },
      },
    },
  },

  linear_search_issues_by_identifier: {
    name: "linear_search_issues_by_identifier",
    description:
      'Search for issues by their identifiers (e.g., ["MIC-78", "MIC-79"])',
    inputSchema: {
      type: "object",
      properties: {
        identifiers: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of issue identifiers to search for",
        },
      },
      required: ["identifiers"],
    },
  },

  linear_get_teams: {
    name: "linear_get_teams",
    description: "Get all teams with their states and labels",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  linear_get_user: {
    name: "linear_get_user",
    description: "Get current user information",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  linear_delete_issue: {
    name: "linear_delete_issue",
    description: "Delete an issue",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Issue identifier (e.g., ENG-123)",
        },
      },
      required: ["id"],
    },
  },

  linear_delete_issues: {
    name: "linear_delete_issues",
    description: "Delete multiple issues",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "List of issue identifiers to delete",
        },
      },
      required: ["ids"],
    },
  },

  linear_get_project: {
    name: "linear_get_project",
    description: "Get project information",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Project identifier",
        },
      },
      required: ["id"],
    },
  },

  linear_search_projects: {
    name: "linear_search_projects",
    description: "Search for projects by name",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project name to search for (exact match)",
        },
      },
      required: ["name"],
    },
  },

  linear_create_issues: {
    name: "linear_create_issues",
    description: "Create multiple issues at once",
    inputSchema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Issue title",
              },
              description: {
                type: "string",
                description: "Issue description",
              },
              teamId: {
                type: "string",
                description: "Team ID",
              },
              projectId: {
                type: "string",
                description: "Project ID",
                optional: true,
              },
              labelIds: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Label IDs to apply",
                optional: true,
              },
            },
            required: ["title", "description", "teamId"],
          },
          description: "List of issues to create",
        },
      },
      required: ["issues"],
    },
  },

  // Comment tools
  linear_create_comment: {
    name: "linear_create_comment",
    description: "Creates a new comment on an issue",
    inputSchema: {
      type: "object",
      properties: {
        body: {
          type: "string",
          description: "Comment text content",
        },
        issueId: {
          type: "string",
          description: "ID of the issue to comment on",
        },
      },
      required: ["body", "issueId"],
    },
  },

  linear_update_comment: {
    name: "linear_update_comment",
    description: "Updates an existing comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID",
        },
        input: {
          type: "object",
          properties: {
            body: {
              type: "string",
              description: "Updated comment text",
            },
          },
          required: ["body"],
        },
      },
      required: ["id", "input"],
    },
  },

  linear_delete_comment: {
    name: "linear_delete_comment",
    description: "Deletes a comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID to delete",
        },
      },
      required: ["id"],
    },
  },

  linear_resolve_comment: {
    name: "linear_resolve_comment",
    description: "Resolves a comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID to resolve",
        },
        resolvingCommentId: {
          type: "string",
          description: "Optional ID of a resolving comment",
          optional: true,
        },
      },
      required: ["id"],
    },
  },

  linear_unresolve_comment: {
    name: "linear_unresolve_comment",
    description: "Unresolves a comment",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Comment ID to unresolve",
        },
      },
      required: ["id"],
    },
  },

  linear_create_customer_need_from_attachment: {
    name: "linear_create_customer_need_from_attachment",
    description: "Creates a new customer need from an attachment",
    inputSchema: {
      type: "object",
      properties: {
        attachmentId: {
          type: "string",
          description: "ID of the attachment",
        },
        title: {
          type: "string",
          description: "Title for the customer need",
          optional: true,
        },
        description: {
          type: "string",
          description: "Description for the customer need",
          optional: true,
        },
        teamId: {
          type: "string",
          description: "Team ID for the customer need",
          optional: true,
        },
      },
      required: ["attachmentId"],
    },
  },
};
