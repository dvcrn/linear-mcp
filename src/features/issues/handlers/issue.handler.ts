import { BaseHandler } from "../../../core/handlers/base.handler.js";
import { BaseToolResponse } from "../../../core/interfaces/tool-handler.interface.js";
import { LinearAuth } from "../../../auth.js";
import { LinearGraphQLClient } from "../../../graphql/client.js";
import {
  IssueHandlerMethods,
  CreateIssueInput,
  CreateIssuesInput,
  BulkUpdateIssuesInput,
  SearchIssuesInput,
  SearchIssuesByIdentifierInput,
  DeleteIssueInput,
  DeleteIssuesInput,
  CreateIssueResponse,
  CreateIssuesResponse,
  UpdateIssueResponse,
  SearchIssuesResponse,
  DeleteIssueResponse,
  Issue,
} from "../types/issue.types.js";
import { DocumentNode } from "graphql";

/**
 * Handler for issue-related operations.
 * Manages creating, updating, searching, and deleting issues.
 */
export class IssueHandler extends BaseHandler implements IssueHandlerMethods {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Creates a single issue.
   */
  async handleCreateIssue(args: CreateIssueInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["title", "description", "teamId"]);

      const result = (await client.createIssue(args)) as CreateIssueResponse;

      if (!result.issueCreate.success || !result.issueCreate.issue) {
        throw new Error("Failed to create issue");
      }

      const issue = result.issueCreate.issue;

      return this.createResponse(
        `Successfully created issue\n` +
          `Issue: ${issue.identifier}\n` +
          `Title: ${issue.title}\n` +
          `URL: ${issue.url}\n` +
          `Project: ${issue.project ? issue.project.name : "None"}`
      );
    } catch (error) {
      this.handleError(error, "create issue");
    }
  }

  /**
   * Creates multiple issues in bulk.
   */
  async handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["issues"]);

      if (!Array.isArray(args.issues)) {
        throw new Error("Issues parameter must be an array");
      }

      const result = (await client.createIssues(
        args.issues
      )) as CreateIssuesResponse;

      if (!result.issueCreate.success) {
        throw new Error("Failed to create issues");
      }

      const createdIssues = result.issueCreate.issues as Issue[];

      return this.createResponse(
        `Successfully created ${createdIssues.length} issues:\n` +
          createdIssues
            .map(
              (issue) =>
                `- ${issue.identifier}: ${issue.title}\n  URL: ${issue.url}`
            )
            .join("\n")
      );
    } catch (error) {
      this.handleError(error, "create issues");
    }
  }

  /**
   * Updates multiple issues in bulk.
   */
  async handleBulkUpdateIssues(
    args: BulkUpdateIssuesInput
  ): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["issueIds", "update"]);

      if (!Array.isArray(args.issueIds)) {
        throw new Error("IssueIds parameter must be an array");
      }

      const result = (await client.updateIssues(
        args.issueIds,
        args.update
      )) as UpdateIssueResponse;

      if (!result.issueUpdate.success) {
        throw new Error("Failed to update issues");
      }

      // Since the response only contains a single issue, we count the number of IDs that were updated
      const updatedCount = args.issueIds.length;

      return this.createResponse(`Successfully updated ${updatedCount} issues`);
    } catch (error) {
      this.handleError(error, "update issues");
    }
  }

  /**
   * Searches for issues with filtering and pagination.
   */
  async handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();

      const filter: Record<string, unknown> = {};

      // Handle identifier-based searches first
      if (args.filter?.identifier) {
        filter.identifier = { in: [args.filter.identifier] };
      }
      // If there's a query but no identifier filter, use it for searching
      else if (args.query) {
        // Pass the raw query to use Linear's native search capabilities
        filter.search = args.query;
      }

      if (args.filter?.project?.id?.eq) {
        filter.project = { id: { eq: args.filter.project.id.eq } };
      }
      if (args.teamIds) {
        filter.team = { id: { in: args.teamIds } };
      }
      if (args.assigneeIds) {
        filter.assignee = { id: { in: args.assigneeIds } };
      }
      if (args.states) {
        filter.state = { name: { in: args.states } };
      }
      if (typeof args.priority === "number") {
        filter.priority = { eq: args.priority };
      }

      const result = (await client.searchIssues(
        filter,
        args.first || 50,
        args.after,
        args.orderBy || "updatedAt"
      )) as SearchIssuesResponse;

      return this.createJsonResponse(result);
    } catch (error) {
      this.handleError(error, "search issues");
    }
  }

  /**
   * Search for issues by their identifiers (e.g., ["MIC-78", "MIC-79"])
   */
  async handleSearchIssuesByIdentifier(
    args: SearchIssuesByIdentifierInput
  ): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["identifiers"]);

      if (!Array.isArray(args.identifiers)) {
        throw new Error("Identifiers parameter must be an array");
      }

      const result = (await client.searchIssues(
        { identifier: { in: args.identifiers } },
        100,
        undefined,
        "updatedAt"
      )) as SearchIssuesResponse;

      if (!result.issues.nodes.length) {
        return this.createResponse(
          `No issues found with identifiers: ${args.identifiers.join(", ")}`
        );
      }

      const formattedResponse = result.issues.nodes
        .map(
          (issue: Issue) =>
            `${issue.identifier}: ${issue.title}\n` +
            (issue.state ? `Status: ${issue.state.name}\n` : "") +
            `URL: ${issue.url}\n` +
            (issue.assignee ? `Assignee: ${issue.assignee.name}\n` : "") +
            (issue.project ? `Project: ${issue.project.name}\n` : "")
        )
        .join("\n");

      return this.createResponse(formattedResponse);
    } catch (error) {
      this.handleError(error, "search issues by identifier");
    }
  }

  /**
   * Deletes a single issue.
   */
  async handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["id"]);

      const result = (await client.deleteIssue(args.id)) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error("Failed to delete issue");
      }

      return this.createResponse(`Successfully deleted issue ${args.id}`);
    } catch (error) {
      this.handleError(error, "delete issue");
    }
  }

  /**
   * Deletes multiple issues in bulk.
   */
  async handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["ids"]);

      if (!Array.isArray(args.ids)) {
        throw new Error("Ids parameter must be an array");
      }

      const result = (await client.deleteIssues(
        args.ids
      )) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error("Failed to delete issues");
      }

      return this.createResponse(
        `Successfully deleted ${args.ids.length} issues: ${args.ids.join(", ")}`
      );
    } catch (error) {
      this.handleError(error, "delete issues");
    }
  }
}
