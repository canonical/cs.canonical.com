import type { MultiSelectItem } from "@canonical/react-components";

import type { IPage } from "@/services/api/types/pages";

export interface IProductsProps {
  page?: IPage;
  onSelectProducts?: (products: MultiSelectItem[]) => void;
}
