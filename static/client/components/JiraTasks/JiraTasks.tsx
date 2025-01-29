import { useMemo } from "react";

import type { IJiraTasksProps } from "./JiraTasks.types";

import config from "@/config";
import { DatesServices } from "@/services/dates";

const JiraTasks = ({ tasks }: IJiraTasksProps): JSX.Element => {
  const sortedTasks = useMemo(
    () => tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [tasks],
  );

  return (
    <table>
      {sortedTasks.map((task) => (
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
    </table>
  );
};

export default JiraTasks;
