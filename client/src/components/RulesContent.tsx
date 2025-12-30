/**
 * Rules Content Component
 *
 * Displays comprehensive game rules for Two Rooms and a Boom.
 */

import React from 'react';

export const RulesContent: React.FC = () => {
  return (
    <div className="text-left space-y-6 text-sm sm:text-base">
      {/* Objective */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Objective</h3>
        <p className="mb-2">
          Two Rooms and a Boom is a social deduction game where two teams compete:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li><strong className="text-game-blue">Blue Team</strong>: Wins if the President survives (is NOT in the same room as the Bomber at game end)</li>
          <li><strong className="text-game-red">Red Team</strong>: Wins if the Bomber successfully eliminates the President (both are in the same room at game end)</li>
          <li><strong className="text-gray-600">Grey Team</strong>: Individual players with unique win conditions independent of Blue or Red</li>
        </ul>
      </section>

      {/* Game Structure */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Game Structure</h3>
        <p className="mb-2">
          Players are randomly divided into two separate rooms: <strong>Room A</strong> and <strong>Room B</strong>.
          Each room operates independently but interacts through hostage exchanges.
        </p>
        <p>
          The game consists of multiple timed rounds (either 3 or 5 rounds total, depending on game configuration).
        </p>
      </section>

      {/* Rounds */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Rounds</h3>
        <p className="mb-2">
          Each round has a time limit. During a round, players can:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Discuss strategy with roommates</li>
          <li>Share their team color (Blue, Red, or Grey)</li>
          <li>Reveal their specific role (optional and strategic)</li>
          <li>Vote for leaders</li>
          <li>Try to deduce who has critical roles (President, Bomber)</li>
        </ul>
        <p className="mt-2">
          When the timer reaches zero, the round ends and leaders select hostages for exchange.
        </p>
      </section>

      {/* Leaders */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Leaders</h3>
        <p className="mb-2">
          Each room must elect a <strong>Leader</strong> through voting:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li><strong>Round 1</strong>: Players vote for their room's leader at the start</li>
          <li><strong>Subsequent Rounds</strong>: Players can call for a new leader vote at any time using the "Vote for New Leader" button</li>
          <li>Even current leaders can call for new votes</li>
          <li>The player with the most votes becomes the leader</li>
        </ul>
        <p className="mt-2">
          <strong>Leader Responsibilities:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Select hostages to send to the other room at the end of each round</li>
          <li>Coordinate room strategy</li>
          <li>Make critical decisions about who to trust</li>
        </ul>
      </section>

      {/* Hostages */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Hostages</h3>
        <p className="mb-2">
          At the end of each round, leaders select <strong>hostages</strong> to exchange between rooms:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li><strong>6-10 players</strong>: 1 hostage per room every round</li>
          <li><strong>11-21 players</strong>: 2 hostages in Round 1, then 1 hostage per round</li>
          <li><strong>22+ players</strong>: 3 hostages in Round 1, 2 in Round 2, then 1 per round</li>
        </ul>
        <p className="mt-2">
          Hostages are <strong>simultaneously exchanged</strong> between rooms. Once exchanged, hostages become members of their new room for the next round.
        </p>
        <p className="mt-2">
          <strong>Strategic Note:</strong> Leaders often try to send suspicious players or gather intelligence by choosing specific hostages.
        </p>
      </section>

      {/* Voting */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Voting</h3>
        <p className="mb-2">
          Players can vote for leaders at any time during active rounds:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Click on a player's name to vote for them as leader</li>
          <li>Once you vote, you cannot change your vote unless you click the same person again to unvote</li>
          <li>When all players have voted, the player with the most votes becomes leader</li>
          <li>Anyone can initiate a new leader vote by clicking "Vote for New Leader"</li>
        </ul>
      </section>

      {/* Card and Color Sharing */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Sharing Information</h3>
        <p className="mb-2">
          Players have two ways to share information:
        </p>
        <div className="ml-4 space-y-2">
          <div>
            <strong>Color Share:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Shows only your team color (Blue, Red, or Grey)</li>
              <li>Safer option that doesn't reveal your specific role</li>
              <li>Use this to build trust without giving away too much information</li>
            </ul>
          </div>
          <div>
            <strong>Card Share:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Shows your team color AND your specific role</li>
              <li>More risky but can be crucial for coordination</li>
              <li>Some roles (like Doctor or Engineer) require card shares to win</li>
            </ul>
          </div>
        </div>
        <p className="mt-2">
          <strong>Important:</strong> You choose when and with whom to share. Share strategically!
        </p>
      </section>

      {/* Special Roles */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Special Roles</h3>
        <p className="mb-2">
          Beyond the basic President and Bomber, there are many special roles:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li><strong>Grey Team Roles</strong>: Win based on individual conditions, not team victory</li>
          <li><strong>Gambler</strong>: Wins by correctly guessing which team will win</li>
          <li><strong>Survivor</strong>: Wins by avoiding the Bomber at game end</li>
          <li><strong>Rival</strong>: Wins by avoiding the President at game end</li>
          <li><strong>MI6</strong>: Wins by card sharing with both President AND Bomber</li>
          <li><strong>Born Leader</strong>: Wins by being a leader at game end</li>
          <li><strong>Doctor</strong>: Blue Team loses unless President card shares with them</li>
          <li><strong>Engineer</strong>: Red Team loses unless Bomber card shares with them</li>
          <li><strong>Agents</strong>: Can force card shares once per round</li>
        </ul>
        <p className="mt-2">
          Check the <strong>Roles</strong> tab to see detailed information about all roles in your current game.
        </p>
      </section>

      {/* Winning */}
      <section>
        <h3 className="font-bold text-lg mb-2 text-game-blue">Winning the Game</h3>
        <p className="mb-2">
          At the end of the final round:
        </p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>The game checks which room the President and Bomber are in</li>
          <li>If they are in the <strong>same room</strong>: Red Team wins (Bomber succeeds)</li>
          <li>If they are in <strong>different rooms</strong>: Blue Team wins (President survives)</li>
          <li>Individual win conditions are checked (Doctor, Engineer, Grey Team roles)</li>
          <li>Players see their win/loss result based on their role and conditions</li>
        </ol>
        <p className="mt-2">
          <strong>Key Strategy:</strong> Communication, deception, and strategic hostage exchanges are essential.
          Trust no one... or everyone!
        </p>
      </section>

      {/* Tips */}
      <section className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
        <h3 className="font-bold text-lg mb-2 text-yellow-700">Pro Tips</h3>
        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
          <li>Don't reveal your role too early unless necessary</li>
          <li>Blue Team members should try to protect the President</li>
          <li>Red Team members should try to send the Bomber to the President's room</li>
          <li>Grey Team players can swing the game by strategically lying about their team</li>
          <li>Watch for players who are TOO eager to share information</li>
          <li>Leaders have significant power - use it wisely</li>
        </ul>
      </section>
    </div>
  );
};
