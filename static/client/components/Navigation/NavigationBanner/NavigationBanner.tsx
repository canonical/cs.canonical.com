import { useCallback, type ReactNode } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { isSelected } from "@/components/Navigation/utils";
import { VIEW_TABLE } from "@/config";
import { useViewsStore } from "@/store/views";

interface NavigationBannerProps {
  children?: React.ReactNode;
}

const NavigationBanner = ({ children }: NavigationBannerProps): ReactNode => {
  const location = useLocation();
  const homepageLink = { url: "/app", label: "Homepage" };
  const navigate = useNavigate();
  const setView = useViewsStore((state) => state.setView);

  const handleNavigation = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      setView(VIEW_TABLE);
      navigate(homepageLink.url);
    },
    [homepageLink.url, navigate, setView],
  );
  return (
    <>
      <Link
        aria-current={isSelected(location.pathname, homepageLink)}
        aria-label={homepageLink.label}
        className="p-panel__logo"
        onClick={handleNavigation}
        to={homepageLink.url}
      >
        <img
          alt=""
          className="is-fading-when-collapsed"
          src="https://assets.ubuntu.com/v1/5b61782f-content_system_logo.png"
          width="175px"
        />
        <img
          alt=""
          className="l-logo__collapsed"
          src="https://assets.ubuntu.com/v1/6e28b173-canonical-brand-tile.png"
          width="22px"
        />
      </Link>
      {children}
    </>
  );
};

export default NavigationBanner;
