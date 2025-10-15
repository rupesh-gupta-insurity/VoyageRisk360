import RiskScoreCard from '../RiskScoreCard';

export default function RiskScoreCardExample() {
  return (
    <div className="w-full max-w-md">
      <RiskScoreCard overall={65} weather={45} piracy={75} traffic={60} claims={55} />
    </div>
  );
}
