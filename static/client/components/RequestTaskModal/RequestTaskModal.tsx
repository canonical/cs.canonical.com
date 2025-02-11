import { type ChangeEvent, useCallback, useMemo, useState } from "react";

import { Button, Input, Modal, RadioInput, Spinner, Textarea, Tooltip } from "@canonical/react-components";

import type { IRequestTaskModalProps } from "./RequestTaskModal.types";

import Reporter from "@/components/Reporter";
import config from "@/config";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { DatesServices } from "@/services/dates";
import { useStore } from "@/store";

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
  const user = useStore((state) => state.user);
  const [reporter, setReporter] = useState(user);

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
          reporter_struct: reporter,
          description: descr,
        }).then(() => {
          setIsLoading(false);
          onClose();
          if (webpage.status === PageStatus.NEW) {
            window.location.href = "/app";
          } else {
            window.location.reload();
          }
        });
      } else {
        PagesServices.requestChanges({
          due_date: dueDate,
          webpage_id: webpage.id,
          reporter_struct: reporter,
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
  }, [dueDate, webpage.id, webpage.status, webpage.copy_doc_link, changeType, reporter, descr, onClose, summary]);

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
                <Tooltip
                  message={
                    <>
                      <span>Copy updates include:</span>
                      <ul className="u-no-margin">
                        <li>Text changes to existing sections</li>
                        <li>Adding a section that is a copy of an existing section, with different text</li>
                        <li>Removing a section</li>
                        <li>Replacing or removing logos or images</li>
                      </ul>
                    </>
                  }
                  zIndex={999}
                >
                  Copy update&nbsp;
                  <i className="p-icon--information" />
                </Tooltip>
              }
              onChange={handleTypeChange(ChangeRequestType.COPY_UPDATE)}
            />
          </div>
          <div className="u-sv2">
            <RadioInput
              checked={changeType === ChangeRequestType.PAGE_REFRESH}
              inline
              label={
                <Tooltip
                  message={
                    <>
                      <span>Page refreshes include:</span>
                      <ul className="u-no-margin">
                        <li>Changing or adding to the page layout</li>
                        <li>Modifications that change the layout</li>
                      </ul>
                    </>
                  }
                  zIndex={999}
                >
                  Page refresh&nbsp;
                  <i className="p-icon--information" />
                </Tooltip>
              }
              onChange={handleTypeChange(ChangeRequestType.PAGE_REFRESH)}
            />
          </div>
        </>
      )}
      <div className="u-sv3">
        <Reporter reporter={reporter} setReporter={setReporter} />
      </div>
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
