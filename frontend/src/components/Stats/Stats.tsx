import './Stats.css';

interface StatsProps {
  memberCount: number;
}

export const Stats = ({ memberCount }: StatsProps) => {
  return (
    <div className="stats">
      <div className="stat-item">
        <div className="stat-number">{memberCount.toLocaleString()}</div>
        <div className="stat-label">Members</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">∞</div>
        <div className="stat-label">Together</div>
      </div>
    </div>
  );
};





