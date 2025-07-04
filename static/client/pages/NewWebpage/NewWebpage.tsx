import { useCallback, useEffect, useMemo, useState } from "react";

import type { MultiSelectItem } from "@canonical/react-components";
import { Button, Input, Spinner } from "@canonical/react-components";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import NavigationItems from "@/components/Navigation/NavigationItems";
import OwnerAndReviewers from "@/components/OwnerAndReviewers";
import Products from "@/components/Products";
import SiteSelector from "@/components/SiteSelector";
import { useQueryParams } from "@/helpers/hooks";
import { usePages } from "@/services/api/hooks/pages";
import { PagesServices } from "@/services/api/services/pages";
import type { IUser } from "@/services/api/types/users";
import { insertPage, TreeServices } from "@/services/tree/pages";
import { useStore } from "@/store";

const errorMessage = "Please specify the URL title";

const LoadingState = {
  INITIAL: 0,
  LOADING: 1,
  DONE: 2,
};

const NewWebpage = (): JSX.Element => {
  const [titleValue, setTitleValue] = useState<string>("");
  const [copyDoc, setCopyDoc] = useState<string>();
  const [owner, setOwner] = useState<IUser | null>();
  const [reviewers, setReviewers] = useState<IUser[]>([]);
  const [products, setProducts] = useState<number[]>([]);
  const [location, setLocation] = useState<string>();
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [reloading, setReloading] = useState<(typeof LoadingState)[keyof typeof LoadingState]>(LoadingState.INITIAL);

  const [selectedProject, setSelectedProject] = useStore((state) => [state.selectedProject, state.setSelectedProject]);
  const { data, isFetching } = usePages(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryParams = useQueryParams();

  useEffect(() => {
    if (titleValue && location && owner) {
      setButtonDisabled(false);
    }
  }, [titleValue, location, owner]);

  const handleTitleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(event.target.value || "");
  }, []);

  const handleCopyDocChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCopyDoc(event.target.value || "");
  }, []);

  const handleSelectOwner = useCallback((user: IUser | null) => {
    setOwner(user);
  }, []);

  const handleSelectReviewers = useCallback((users: IUser[]) => {
    setReviewers(users);
  }, []);

  const handleSelectPage = useCallback((path: string) => {
    setLocation(path);
  }, []);

  const handleSelectProducts = useCallback((products: MultiSelectItem[]) => {
    setProducts(products.map((p) => Number(p.value)));
  }, []);

  const finalUrl = useMemo(() => {
    return `${location !== "/" ? location : ""}/${titleValue}`;
  }, [location, titleValue]);

  const handleSubmit = useCallback(() => {
    if (titleValue && owner && selectedProject && location) {
      setReloading(LoadingState.LOADING);
      const newPage = {
        name: finalUrl,
        copy_doc_link: copyDoc,
        owner,
        reviewers,
        project: selectedProject.name,
        parent: location === "/" ? "" : location,
        product_ids: products,
        content_jira_id: queryParams.get("content_jira_id") || "",
      };
      PagesServices.createPage(newPage).then(async (response) => {
        const new_webpage = response.data.webpage;

        if (new_webpage.project && new_webpage.project.name) {
          insertPage(new_webpage, queryClient);
          const project = data?.find((p) => p.name === new_webpage.project?.name);
          if (project) setSelectedProject(project);
          navigate(`/app/webpage/${new_webpage.project?.name}${new_webpage.url}`);
        } else {
          throw new Error("Error creating a new webpage.");
        }
      });
    }
  }, [
    titleValue,
    owner,
    selectedProject,
    location,
    finalUrl,
    copyDoc,
    reviewers,
    products,
    queryParams,
    queryClient,
    data,
    setSelectedProject,
    navigate,
  ]);

  // update navigation after new page is added to the tree on the backend
  useEffect(() => {
    if (!isFetching && reloading === LoadingState.DONE && data?.length && selectedProject) {
      const project = data.find((p) => p.name === selectedProject.name);
      if (project) {
        const isNewPageExist = TreeServices.findPage(project.templates, `${location}/${titleValue}`);
        if (isNewPageExist) {
          // TODO: there is a max depth React error on this line, needs more investigation
          setSelectedProject(project);
          window.location.href = `/app/webpage/${project.name}${location}/${titleValue}`;
        }
      }
    }
  }, [data, isFetching, reloading, selectedProject, setSelectedProject, location, titleValue]);

  useEffect(() => {
    if (selectedProject) {
      setLocation("/");
    }
  }, [selectedProject]);

  return (
    <div className="l-new-webpage">
      <h1>New page</h1>
      <div>
        <p className="p-text--small-caps" id="url-title">
          URL Title (lowercase, hyphenated)
        </p>
        <Input
          aria-labelledby="url-title"
          error={titleValue ? null : errorMessage}
          onChange={handleTitleChange}
          type="text"
          value={titleValue}
        />
      </div>
      <div className="l-new-webpage--location">
        <p className="p-text--small-caps">Location</p>
        <SiteSelector />
        <NavigationItems onSelectPage={handleSelectPage} />
      </div>
      <p className="u-text--muted">
        URL will be:&nbsp;
        {selectedProject?.name}
        {finalUrl}
      </p>
      <div>
        <p className="p-text--small-caps" id="copy-doc">
          Copy doc
        </p>
        <Input
          aria-labelledby="copy-doc"
          help="If no copy doc is provided, a new one will be created when you save."
          onChange={handleCopyDocChange}
          type="text"
          value={copyDoc}
        />
      </div>
      <OwnerAndReviewers onSelectOwner={handleSelectOwner} onSelectReviewers={handleSelectReviewers} />
      <div className="u-sv3" />
      <Products onSelectProducts={handleSelectProducts} />
      <Button appearance="positive" className="l-new-webpage--submit" disabled={buttonDisabled} onClick={handleSubmit}>
        {reloading === LoadingState.LOADING ? <Spinner /> : `Save${copyDoc ? "" : " and generate copy doc"}`}
      </Button>
    </div>
  );
};

export default NewWebpage;
