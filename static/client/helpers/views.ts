import type { NavigateFunction, Location } from "react-router-dom";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const flashRowTwice = (row: HTMLElement) => {
  let toggles = 0;

  const interval = setInterval(() => {
    row.classList.toggle("p-table__row--highlight");
    if (++toggles === 4) {
      clearInterval(interval);
      row.classList.remove("p-table__row--highlight");
    }
  }, 300);
};

export const goBack = (location: Location, navigate: NavigateFunction) => {
  let hash = location.pathname.split("/webpage/")[1].replaceAll(".", "\\.").replaceAll("/", "\\/");
  navigate(-1);
  sleep(10).then(() => {
    let selectedRow = document.querySelector(`#${hash}`) as HTMLElement;
    if (selectedRow) {
      selectedRow.scrollIntoView({ behavior: "smooth", block: "center" });
      flashRowTwice(selectedRow);
    }
  });
};
