import { formatAmerican, formatDateShort, signedPts } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { MyOrder } from '@/lib/types';
import type { PositionSummary } from '@/lib/positions';
import { cn } from '@/lib/utils';

const RESULT_LABEL = { WON: 'Won', LOST: 'Lost', PUSH: 'Push', PENDING: 'Awaiting result', MIXED: 'Partially settled' } as const;

export function matchupOf(order: MyOrder): string {
  const game = order.pick.game;
  const team = teamFor(order.pick.side === 'HOME' ? game.homeTeam : game.awayTeam);
  return `${teamFor(game.awayTeam).abbrev} @ ${teamFor(game.homeTeam).abbrev} / ${team.nickname}`;
}

export function PositionsTable({
  rows,
  settled,
  mobileCards,
}: {
  rows: { order: MyOrder; position: PositionSummary }[];
  settled?: boolean;
  mobileCards?: boolean;
}) {
  const headers = settled
    ? ['MATCHUP / TEAM', 'SIDE', 'ODDS', 'STAKE', 'MAX LOSS', 'REALIZED P&L', 'RESULT', 'SETTLEMENT']
    : ['MATCHUP / TEAM', 'SIDE', 'AVG. ODDS', 'STAKE', 'MAX LOSS', 'POTENTIAL PROFIT', 'SETTLEMENT'];

  const cellFor = ({ order, position }: { order: MyOrder; position: PositionSummary }) => {
    const result = RESULT_LABEL[position.status];
    const cells: React.ReactNode[] = [
      <span key="m">{matchupOf(order)}</span>,
      <span key="s" className={position.side === 'WITH' ? 'text-forest' : 'text-burgundy'}>{position.side}</span>,
      <span key="o" className="numeral">{position.matchedStake > 0 ? formatAmerican(position.avgOdds) : '—'}</span>,
      <span key="t" className="numeral">{position.matchedStake.toLocaleString()}</span>,
      <span key="l" className="numeral">
        {(settled ? position.settledExposure : position.maxLoss).toLocaleString()}
      </span>,
      settled ? (
        <span key="p" className={cn('numeral', position.realized >= 0 ? 'text-forest' : 'text-burgundy')}>
          {signedPts(position.realized)}
        </span>
      ) : (
        <span key="p" className="numeral text-forest">{signedPts(position.potentialProfit)}</span>
      ),
    ];
    if (settled) cells.push(<span key="r">{result}</span>);
    cells.push(
      <span key="d" className="numeral text-muted">
        {settled ? `${formatDateShort(order.pick.game.kickoff).split('·')[0]?.trim()} · Final` : result}
      </span>,
    );
    return cells;
  };

  const cardFor = ({ order, position }: { order: MyOrder; position: PositionSummary }) => (
    <div key={`${order.pickId}-${position.side}`} className="flex flex-col gap-2 border border-parchment p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">{matchupOf(order)}</p>
        <span className={cn('font-condensed text-[12px] uppercase', position.side === 'WITH' ? 'text-forest' : 'text-burgundy')}>
          {position.side}
        </span>
      </div>
      <p className="font-mono text-[12px]">
        {position.matchedStake} pts @ {position.matchedStake > 0 ? formatAmerican(position.avgOdds) : '—'} · {settled ? 'risked' : 'max loss'}{' '}
        {settled ? position.settledExposure : position.maxLoss}
      </p>
      <p className={cn('font-mono text-[12px]', settled ? (position.realized >= 0 ? 'text-forest' : 'text-burgundy') : 'text-forest')}>
        {settled ? `${RESULT_LABEL[position.status]} · ${signedPts(position.realized)}` : `${signedPts(position.potentialProfit)} if won · ${RESULT_LABEL[position.status]}`}
      </p>
    </div>
  );

  if (mobileCards) return <>{rows.map(cardFor)}</>;

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-parchment">
          {headers.map((h) => (
            <th key={h} className="label font-normal text-muted">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.order.pickId}-${row.position.side}`} className="min-h-[58px] border-b border-parchment text-[12px]">
            {cellFor(row).map((cell, i) => (
              <td key={i} className="py-3 pr-3 align-middle">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
