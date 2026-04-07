import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config from "@/config";
import { useWebpageStats } from "@/services/api/hooks/stats";
import type { IPageStats } from "@/services/api/types/pages";

interface IWebpageStatsProps {
  url: string;
  project: string;
}

const WebpageStats = ({ url, project }: IWebpageStatsProps) => {
  const { data: statsData = {} as IPageStats["data"], isLoading } = useWebpageStats(url, project);

  return (
    <>
      <h2 className="p-text--small-caps">Page Stats</h2>
      <div className="l-webpage__details">
        <div className="label u-text--muted">Last updated</div>
        <div className="value">{isLoading ? "Loading..." : statsData.last_updated}</div>

        <div className="label u-text--muted">
          Readability score
          <IconTextWithTooltip icon="information" message={config.tooltips.readability} />
        </div>
        <div className="value">{isLoading ? "Loading..." : statsData.readability_score}</div>

        <div className="label u-text--muted">
          Accessibility score
          <IconTextWithTooltip icon="information" message={config.tooltips.accessibility} />
        </div>
        <div className="value">{isLoading ? "Loading..." : statsData.accessibility_score}</div>

        <div className="label u-text--muted">Link count</div>
        <div className="value">{isLoading ? "Loading..." : statsData.link_count}</div>

        <div className="label u-text--muted">
          Prohibited words
          <IconTextWithTooltip icon="information" message={isLoading ? "" : statsData.prohibited_words} />
        </div>
        <div className="value">{isLoading ? "Loading..." : statsData.copy_errors}</div>
      </div>
    </>
  );
};

export default WebpageStats;
