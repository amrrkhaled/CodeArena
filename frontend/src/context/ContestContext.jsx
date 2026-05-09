import { useState, useEffect, useCallback } from "react";
import { ContestContext } from "./ContextCreation";
import api from "../api";

const STORAGE_KEY = "selectedContestId";
const normalizeContest = (contest) => ({
  ...contest,
  id: contest?.id ?? contest?.contest_id ?? contest?.contestId ?? "",
  name:
    contest?.name ??
    contest?.contest_name ??
    contest?.contestName ??
    contest?.title ??
    "",
  is_active: Boolean(contest?.is_active ?? contest?.isActive),
  blind_started_at:
    contest?.blind_started_at ??
    contest?.blindStartedAt ??
    null,
});

const getContestArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.contests)) {
    return payload.contests;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  return [];
};

export const ContestProvider = ({ children }) => {
  const [contests, setContests] = useState([]);
  const [selectedContestId, setSelectedContestId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [currentContest, setCurrentContest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState();
  const [blindTimeStarted, setBlindTimeStarted] = useState(false);

  const refreshContests = useCallback(async (preferredContestId = null) => {
    try {
      const response = await api.get("/contests");
      const fetchedContests = getContestArray(response.data)
        .map(normalizeContest)
        .filter((contest) => contest.id);
      setContests(fetchedContests);

      setSelectedContestId((prev) => {
        const forcedContest = preferredContestId
          ? fetchedContests.find((contest) => String(contest.id) === String(preferredContestId))
          : null;
        if (forcedContest) {
          return String(forcedContest.id);
        }

        const exists = fetchedContests.some((contest) => String(contest.id) === String(prev));
        if (exists) {
          return String(prev);
        }

        const activeContest = fetchedContests.find((contest) => contest.is_active);
        if (activeContest) {
          return String(activeContest.id);
        }

        return fetchedContests[0] ? String(fetchedContests[0].id) : "";
      });
    } catch (err) {
      console.error("Failed to fetch contests", err);
      setContests([]);
    }
  }, []);

  useEffect(() => {
    refreshContests();
  }, [refreshContests]);

  useEffect(() => {
    if (selectedContestId) {
      localStorage.setItem(STORAGE_KEY, String(selectedContestId));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedContestId]);

  useEffect(() => {
    const selected = contests.find((contest) => String(contest.id) === String(selectedContestId)) || null;
    setCurrentContest(selected);

    if (!selected || !selectedContestId) return;

    if (!selected.is_active) {
      setStatus("inactive");
      setTimeLeft(null);
      setBlindTimeStarted(false);
      return;
    }

    const { start_time, end_time, blind_started_at } = selected;
    const now = Date.now();
    const start = new Date(start_time).getTime();
    const end = new Date(end_time).getTime();
    const blindStart = blind_started_at ? new Date(blind_started_at).getTime() : null;

    if (now < start) {
      setStatus("upcoming");
      setTimeLeft(Math.floor((start - now) / 1000));
    } else if (now > end) {
      setStatus("ended");
      setTimeLeft(0);
    } else {
      setStatus("running");
      setTimeLeft(Math.floor((end - now) / 1000));
    }

    setBlindTimeStarted(Boolean(blindStart && now >= blindStart && now <= end));
  }, [contests, selectedContestId]);

  useEffect(() => {
    if (!selectedContestId) {
      setCurrentContest(null);
      setStatus(undefined);
      setTimeLeft(null);
      setBlindTimeStarted(false);
      return;
    }

    const fetchContestTime = async () => {
      try {
        const response = await api.get(`/contests/${selectedContestId}`);
        const selectedContest = normalizeContest(response.data);
        setCurrentContest(selectedContest);

        const { start_time, end_time, blind_started_at } = selectedContest;
        const now = Date.now();
        const start = new Date(start_time).getTime();
        const end = new Date(end_time).getTime();
        const blindStart = blind_started_at ? new Date(blind_started_at).getTime() : null;

        if (now < start) {
          setStatus("upcoming");
          setTimeLeft(Math.floor((start - now) / 1000));
        } else if (now > end){
            setStatus("ended");
            setTimeLeft(0);
        } else {
            setStatus("running");
            setTimeLeft(Math.floor((end - now) / 1000));
        }

        setBlindTimeStarted(Boolean(blindStart && now >= blindStart && now <= end));

      } catch (err) {
        console.error("Failed to fetch contest times", err);
        setStatus(undefined);
        setTimeLeft(null);
        setBlindTimeStarted(false);
      }
    };

    fetchContestTime();
  }, [selectedContestId]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <ContestContext.Provider
      value={{
        contests,
        selectedContestId,
        setSelectedContestId,
        currentContest,
        refreshContests,
        timeLeft,
        status,
        blindTimeStarted,
      }}
    >
      {children}
    </ContestContext.Provider>
  );
};
