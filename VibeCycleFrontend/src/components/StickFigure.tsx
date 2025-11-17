import React from "react";

type Props = {
  energyLevel: number;
};

const StickFigure: React.FC<Props> = ({ energyLevel }) => {
  // determine states
  const isExhausted = energyLevel === 1;
  const isTired = energyLevel === 2;
  const isCalm = energyLevel === 3;
  const isMotivated = energyLevel === 4;
  const isEnergized = energyLevel === 5;

  return (
    <div className="flex items-center justify-center p-4">
      <style>{`
        .sf-bounce { animation: sf-bounce 900ms ease-in-out infinite; transform-origin: center bottom; }
        @keyframes sf-bounce { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }

        .sf-dance-arm { transform-origin: 6px 6px; animation: sf-dance 550ms ease-in-out infinite; }
        .sf-dance-leg { transform-origin: 2px 2px; animation: sf-dance-leg 450ms ease-in-out infinite; }
        @keyframes sf-dance { 0%{transform:rotate(20deg)}50%{transform:rotate(-20deg)}100%{transform:rotate(20deg)} }
        @keyframes sf-dance-leg { 0%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}100%{transform:rotate(-20deg)} }

        .sf-breathe { animation: sf-breathe 1800ms ease-in-out infinite; transform-origin: center; }
        @keyframes sf-breathe { 0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)} }

        .sf-zz { animation: sf-zz 2000ms linear infinite; opacity: 0; }
        @keyframes sf-zz { 0%{opacity:0; transform:translateY(0)}25%{opacity:1}50%{transform:translateY(-8px)}75%{opacity:0}100%{opacity:0} }
      `}</style>

      <svg width="120" height="140" viewBox="0 0 60 80" aria-hidden="true">
        {/* head */}
        <g transform="translate(30,14)">
          <circle r="8" fill="#fde68a" stroke="#333" />
          {/* face expressions */}
          {isExhausted && (
            <g>
              {/* sleepy closed/droopy eyes */}
              <path d="M -5 -1 q2 2 4 0" stroke="#333" strokeWidth="0.9" fill="none" />
              <path
                d="M -1.5 -0.8 q1 1.2 3 0"
                stroke="#333"
                strokeWidth="0.9"
                fill="none"
                opacity="0.9"
                transform="translate(0,0)"
              />
              {/* mouth (swapped from tired) */}
              <path d="M -3.5 2 Q 0 0 3.5 2" stroke="#333" strokeWidth="0.9" fill="none" />
              {/* tiny droplet to emphasize sleepiness */}
              <ellipse cx="6" cy="-2" rx="0.9" ry="1.6" fill="#cbd5e1" opacity="0.9" />
            </g>
          )}
          {isTired && (
            <g>
              {/* mouth (same as exhausted) */}
              <path d="M -3.5 2 Q 0 0 3.5 2" stroke="#333" strokeWidth="0.9" fill="none" />
              <circle cx="-3" cy="-1" r="0.9" fill="#333" />
              <circle cx="3" cy="-1" r="0.9" fill="#333" />
            </g>
          )}
          {isCalm && (
            <g>
              <path d="M -3 -1 Q 0 2 3 -1" stroke="#333" strokeWidth="0.9" fill="none" />
              <circle cx="-3" cy="-2" r="0.9" fill="#333" />
              <circle cx="3" cy="-2" r="0.9" fill="#333" />
            </g>
          )}
          {isMotivated && (
            <g>
              <path d="M -4 -1 Q 0 4 4 -1" stroke="#333" strokeWidth="0.9" fill="none" />
              <circle cx="-3" cy="-2" r="0.9" fill="#333" />
              <circle cx="3" cy="-2" r="0.9" fill="#333" />
            </g>
          )}
          {isEnergized && (
            <g>
              <path d="M -5 -2 Q 0 6 5 -2" stroke="#333" strokeWidth="1" fill="none" />
              <circle cx="-3" cy="-3" r="0.9" fill="#333" />
              <circle cx="3" cy="-3" r="0.9" fill="#333" />
            </g>
          )}
        </g>

        {/* body */}
        <g transform="translate(30,24)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="18"
            stroke="#333"
            strokeWidth="1.5"
            className={isCalm ? "sf-breathe" : isMotivated ? "sf-bounce" : undefined}
          />

          {/* arms */}
          <g>
            <line
              x1="0"
              y1="6"
              x2="-12"
              y2="0"
              stroke="#333"
              strokeWidth="1.5"
              className={isEnergized ? "sf-dance-arm" : undefined}
            />
            <line
              x1="0"
              y1="6"
              x2="12"
              y2="0"
              stroke="#333"
              strokeWidth="1.5"
              className={isEnergized ? "sf-dance-arm" : undefined}
            />
          </g>

          {/* legs */}
          <g>
            <line
              x1="0"
              y1="18"
              x2="-10"
              y2="32"
              stroke="#333"
              strokeWidth="1.5"
              className={isEnergized ? "sf-dance-leg" : isMotivated ? "sf-bounce" : undefined}
            />
            <line
              x1="0"
              y1="18"
              x2="10"
              y2="32"
              stroke="#333"
              strokeWidth="1.5"
              className={isEnergized ? "sf-dance-leg" : isMotivated ? "sf-bounce" : undefined}
            />
          </g>
        </g>

        {/* sleepy zzz (show for both tired and exhausted) */}
        {(isTired || isExhausted) && (
          <g>
            <text x="40" y="10" fontSize="6" fill="#cbd5e1" className="sf-zz">
              z
            </text>
            <text x="44" y="6" fontSize="6" fill="#cbd5e1" className="sf-zz" style={{ animationDelay: "300ms" }}>
              z
            </text>
            <text x="48" y="2" fontSize="6" fill="#cbd5e1" className="sf-zz" style={{ animationDelay: "600ms" }}>
              z
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default StickFigure;
