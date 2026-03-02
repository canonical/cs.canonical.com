import { type ReactNode } from "react";

import type { IJiraTasksProps } from "./JiraTasks.types";

import config from "@/config";
import { DatesServices } from "@/services/dates";
import "./JiraTasks.scss";

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "in progress":
    case "in review":
    case "to be deployed":
      return "p-jira-status-indicator--information";
    case "done":
    case "rejected":
      return "p-jira-status-indicator--positive";
    case "blocked":
      return "p-jira-status-indicator--caution";
    default:
      return "p-jira-status-indicator";
  }
}

const JiraTasks = ({ tasks }: IJiraTasksProps): ReactNode => {
  return (
    <table>
      <thead>
        <tr>
          <th colSpan={3}>Summary</th>
          <th>Request type</th>
          <th>Status</th>
          <th>Date created</th>
          <th>Ticket id</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr>
            <td colSpan={3}>{task.summary}</td>
            <td>Copy update</td>
            <td style={{ display: "flex", alignItems: "center" }}>
              <span className={getStatusClass(task.status)}></span>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
            </td>
            <td>{DatesServices.beatifyDate(task.created_at)}</td>
            <td>
              <a href={`${config.jiraTaskLink}${task.jira_id}`} rel="noreferrer" target="_blank">
                {task.jira_id}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JiraTasks;
