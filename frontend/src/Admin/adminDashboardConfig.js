import { AddContest } from "./AddContest";
import { DropProblemsFile } from "./DropProblemsFile";
import { ManageContests } from "./ManageContests";
import { GenerateTeams } from "./GenerateTeams";
import { AdminShowAllSubmission } from "./AdminShowAllSubmission";
import { AdminLeaderboard } from "./AdminLeaderboard";

export const ADMIN_TABS = [
  { id: "setup", label: "Contest Setup", description: "Create a contest and upload its problem file." },
  { id: "contests", label: "Manage Contests", description: "Edit schedules and toggle contest visibility." },
  { id: "teams", label: "Teams", description: "Generate teams and export credentials." },
  { id: "submissions", label: "Submissions", description: "Review all incoming attempts." },
  { id: "leaderboard", label: "Leaderboard", description: "Monitor rankings and penalties." },
];

export const ADMIN_TAB_CONTENT = {
  setup: {
    heading: "Contest Setup",
    description: "Create the contest, then upload its problem file.",
    layoutClassName: "admin-grid admin-grid-two",
    sections: [
      {
        eyebrow: "Step 1",
        title: "Create Contest",
        component: AddContest,
      },
      {
        eyebrow: "Step 2",
        title: "Upload Problems",
        component: DropProblemsFile,
      },
    ],
  },
  contests: {
    heading: "Manage Contests",
    description: "Edit schedules and status in one place.",
    layoutClassName: "",
    sections: [
      {
        eyebrow: "Control",
        fullWidth: true,
        component: ManageContests,
      },
    ],
  },
  teams: {
    heading: "Teams",
    description: "Create teams and export credentials.",
    layoutClassName: "",
    sections: [
      {
        eyebrow: "Teams",
        fullWidth: true,
        component: GenerateTeams,
      },
    ],
  },
  submissions: {
    heading: "Submissions",
    description: "Review all attempts for the selected contest.",
    layoutClassName: "",
    sections: [
      {
        eyebrow: "Monitor",
        fullWidth: true,
        component: AdminShowAllSubmission,
      },
    ],
  },
  leaderboard: {
    heading: "Leaderboard",
    description: "See rankings for the selected contest.",
    layoutClassName: "",
    sections: [
      {
        eyebrow: "Rankings",
        fullWidth: true,
        component: AdminLeaderboard,
      },
    ],
  },
};
