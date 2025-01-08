import { type ChangeEvent, useCallback, useMemo, useState } from "react";

import { Button, Input, Modal, RadioInput, Spinner, Textarea, Tooltip } from "@canonical/react-components";

import type { IRequestTaskModalProps } from "./RequestTaskModal.types";

import config from "@/config";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { DatesServices } from "@/services/dates";

const RequestTaskModal = ({
  changeType,
  copyDocLink,
  onTypeChange,
  onClose,
  webpage,
}: IRequestTaskModalProps): JSX.Element => {
  const [dueDate, setDueDate] = useState<string>();
  const [checked, setChecked] = useState(false);
  const [summary, setSummary] = useState<string>();
  const [descr, setDescr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeDueDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  }, []);

  const handleChangeConsent = useCallback(() => {
    setChecked((prevValue) => !prevValue);
  }, []);

  const handleSummaryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSummary(e.target.value);
  }, []);

  const handleDescrChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescr(e.target.value);
  }, []);

  const handleTypeChange = useCallback(
    (type: (typeof ChangeRequestType)[keyof typeof ChangeRequestType]) => () => {
      onTypeChange(type);
    },
    [onTypeChange],
  );

  const handleSubmit = useCallback(() => {
    if (dueDate && webpage?.id) {
      setIsLoading(true);
      if (changeType === ChangeRequestType.PAGE_REMOVAL) {
        PagesServices.requestRemoval({
          due_date: dueDate,
          webpage_id: webpage.id,
          reporter_id: webpage.owner.id,
          description: descr,
        }).then(() => {
          setIsLoading(false);
          onClose();
          if (webpage.status === PageStatus.NEW) {
            window.location.href = "/";
          } else {
            window.location.reload();
          }
        });
      } else {
        PagesServices.requestChanges({
          due_date: dueDate,
          webpage_id: webpage.id,
          reporter_id: webpage.owner.id,
          type: changeType,
          summary,
          description: `Copy doc link: ${webpage.copy_doc_link} \n${descr}`,
        }).then(() => {
          setIsLoading(false);
          onClose();
          window.location.reload();
        });
      }
    }
  }, [changeType, dueDate, summary, descr, webpage, onClose]);

  const title = useMemo(() => {
    switch (changeType) {
      case ChangeRequestType.COPY_UPDATE:
        return "Submit changes for copy update";
      case ChangeRequestType.PAGE_REFRESH:
        return "Submit changes for page refresh";
      case ChangeRequestType.NEW_WEBPAGE:
        return "Submit new page for publication";
      case ChangeRequestType.PAGE_REMOVAL:
        return "Submit request for page removal";
      default:
        return "Submit request";
    }
  }, [changeType]);

  const submitButtonEnabled = useMemo(
    () => dueDate && (changeType === ChangeRequestType.PAGE_REMOVAL || checked),
    [dueDate, changeType, checked],
  );

  return (
    <Modal
      buttonRow={
        <>
          <Button className="u-no-margin--bottom" onClick={onClose}>
            Cancel
          </Button>
          <Button appearance="positive" disabled={!submitButtonEnabled} onClick={handleSubmit}>
            {isLoading ? <Spinner /> : "Submit"}
          </Button>
        </>
      }
      close={onClose}
      title={title}
    >
      {[ChangeRequestType.COPY_UPDATE, ChangeRequestType.PAGE_REFRESH].indexOf(changeType) >= 0 && (
        <>
          <div className="u-sv2">
            <RadioInput
              checked={changeType === ChangeRequestType.COPY_UPDATE}
              inline
              label={
                <>
                  Copy update&nbsp;
                  <Tooltip
                    message={
                      <ul className="u-no-margin">
                        <li>Textual changes in existing sections of a webpage</li>
                        <li>
                          Adding a new section in an existing layout,
                          <br />
                          identical to an existing section in terms of design,
                          <br />
                          but with different textual content. <br />
                          Or removing a section entirely.
                        </li>
                        <li>Replacing existing logos and images</li>
                        <li>Removing an image or a logo</li>
                      </ul>
                    }
                    zIndex={999}
                  >
                    <i className="p-icon--information" />
                  </Tooltip>
                </>
              }
              onChange={handleTypeChange(ChangeRequestType.COPY_UPDATE)}
            />
          </div>
          <div className="u-sv2">
            <RadioInput
              checked={changeType === ChangeRequestType.PAGE_REFRESH}
              inline
              label={
                <>
                  Page refresh&nbsp;
                  <Tooltip
                    message={
                      <ul className="u-no-margin">
                        <li>
                          Changing or adding to the existing layout,
                          <br />
                          this can be the whole page or just one section
                        </li>
                        <li>The new modification changes the existing layout</li>
                        <li>Requires a UI and UX review</li>
                      </ul>
                    }
                    zIndex={999}
                  >
                    <i className="p-icon--information" />
                  </Tooltip>
                </>
              }
              onChange={handleTypeChange(ChangeRequestType.PAGE_REFRESH)}
            />
          </div>
        </>
      )}
      <Input label="Due date" min={DatesServices.getNowStr()} onChange={handleChangeDueDate} required type="date" />
      <Input label="Summary" onChange={handleSummaryChange} type="text" />
      <Textarea label="Description" onChange={handleDescrChange} />
      {changeType !== ChangeRequestType.PAGE_REMOVAL && (
        <Input
          checked={checked}
          label={
            <span>
              I have added all the content to the{" "}
              <a href={copyDocLink} rel="noreferrer" target="_blank">
                copy doc
              </a>
              , and it is consistent with our{" "}
              <a href={config.copyStyleGuideLink} rel="noreferrer" target="_blank">
                copy style guides
              </a>
            </span>
          }
          onChange={handleChangeConsent}
          required
          type="checkbox"
        />
      )}
    </Modal>
  );
};

export default RequestTaskModal;
