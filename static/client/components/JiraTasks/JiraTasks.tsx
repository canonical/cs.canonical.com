import { type ReactNode } from "react";

import type { IJiraTasksProps } from "./JiraTasks.types";

import config from "@/config";
import { DatesServices } from "@/services/dates";

const JiraTasks = ({ tasks }: IJiraTasksProps): ReactNode => {
  return (
    <table>
      <thead>
        <tr>
          <th>Jira Id</th>
          <th>Summary</th>
          <th>Created At</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr>
            <td>
              <a href={`${config.jiraTaskLink}${task.jira_id}`} rel="noreferrer" target="_blank">
                {task.jira_id}
              </a>
            </td>
            <td>{task.summary}</td>
            <td className="u-text--muted">{DatesServices.beatifyDate(task.created_at)}</td>
            <td>{task.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JiraTasks;
