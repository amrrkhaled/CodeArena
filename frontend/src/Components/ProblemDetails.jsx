import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { Typography, Paper, Button, TextField, Select, MenuItem, FormControl, FormHelperText } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import 'katex/dist/katex.min.css'
import api from "../api";
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import { ContestContext } from "../context/ContextCreation";
import "../style/ProblemDetails.css";


const ProblemDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [languageId, setLanguageId] = useState("");
    const [languagesLoading, setLanguagesLoading] = useState(false);
    const [languagesError, setLanguagesError] = useState("");
    const [code, setCode] = useState("");
    const [verdict, setVerdict] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [testCases, setTestCases] = useState([]);
    const [uploadedFileName, setUploadedFileName] = useState("");
    const { selectedContestId } = useContext(ContestContext);
    const contestId = selectedContestId;

    //problem details
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
        }
        if (!contestId) {
        setNotFound(true);
        return;
        }

        api.get(`/problems/${contestId}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setProblem(res.data);
        })
        .catch(err => {
            console.error("Problem fetch failed:", err);
            if (err.response?.status === 401) {
            navigate("/login");
            } else {
            setNotFound(true);
            }
        });
    }, [contestId, id, navigate]);

    // LaTeX
    useEffect(() => {
        if (problem) {
            renderMathInElement(document.getElementById("problem-container"), {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    }, [problem]);

    //languages
    useEffect(() => {
        setLanguagesLoading(true);
        setLanguagesError("");
        api.get("/languages")
        .then(res => {
            const fetchedLanguages = Array.isArray(res.data) ? res.data : [];
            setLanguages(fetchedLanguages);
        })
        .catch(err => {
            console.error("Error fetching languages:", err);
            setLanguages([]);
            setLanguagesError("Failed to load languages.");
        })
        .finally(() => {
            setLanguagesLoading(false);
        });
    }, []);

    //test cases
    useEffect(() => {
        try {
            api.get(`/problems/${contestId}/${id}/test-cases`)
            .then(res => {
                setTestCases(res.data);
            })
            .catch(err => {
                console.error("Error fetching test cases:", err);
                setError("Failed to fetch test cases.");
            });
        } catch (error) {
            console.error("Error in fetching test cases:", error);
            setError("Failed to fetch test cases.");
        }
    }, [contestId, id]);

    //files
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
        setCode(event.target.result);
        };
        reader.readAsText(file);
    };

    //submit solution
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
        const res = await api.post(
            "/submissions",
            {
            problem_id: id,
            language_id: languageId,
            code,
            contest_id: contestId
            },
            {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        setVerdict(res.data.verdict);
        setSuccess(true);
        setUploadedFileName("");
        } catch (err) {
        console.error("Submission error:", err.response || err.message || err);
        setError(err.response?.data?.error || "Submission failed. Please try again.");
        } finally {
        setLoading(false);
        }
    };

    if (!contestId)
        return (
        <Typography style={{ display: "flex", justifyContent: "center", height: "89vh", alignItems: "center", color: "var(--text-strong)" }} variant="h5">
            Select a contest first
        </Typography>
        );

    if (notFound || !problem)
        return (
        <Typography style={{ display: "flex", justifyContent: "center", height: "89vh", alignItems: "center", color: "var(--text-strong)" }} variant="h5">
            Problem not found
        </Typography>
        );

    return (
        <div className="problem-details-page">
        {/* Problem details */}
        <Paper className="problem-sheet">
            <Typography variant="h4" gutterBottom className="problem-sheet-title">
            {problem.title}
            </Typography>

            <Typography variant="body2" className="problem-meta">
            Time Limit: {problem.time_limit_ms} ms | Memory Limit: {problem.memory_limit_mb} MB
            </Typography>

            <br />
            <div id="problem-container">
                <Typography variant="body1" paragraph style={{ whiteSpace: "pre-wrap",  fontSize: '1.1rem', color: "var(--text)" }}>
                    {problem.description}
                </Typography>

                <Typography variant="h5" style={{ color: "var(--text-strong)" }}>Input</Typography>
                <Typography variant="body1" paragraph style={{ whiteSpace: "pre-wrap",  fontSize: '1.05rem', color: "var(--text)" }}>
                    {problem.input_description}
                </Typography>
                
                <Typography variant="h5" style={{ color: "var(--text-strong)" }}>Output</Typography>
                <Typography variant="body1" paragraph style={{ whiteSpace: "pre-wrap",  fontSize: '1.05rem', color: "var(--text)" }}>
                    {problem.output_description}
                </Typography>
            </div>
           
            {/* Test cases */}
            <Typography variant="h6" style={{ color: "var(--text-strong)", marginTop: "2rem", marginBottom: "1rem" }}>Test Cases</Typography>
            

            {testCases.length > 0 ? (
            <div>
                {testCases.filter(test => test.is_sample).map((test, index) => (
                <div key={index} style={{ marginBottom: "1.5rem" }}>
                    <Typography variant="subtitle1" style={{ color: "var(--text)" }}>Sample Input {index + 1}</Typography>
                    <Paper style={{backgroundColor: "var(--bg)", color: "var(--text)", padding: "0.75rem",marginBottom: "1rem",borderRadius: "16px", position: "relative", border: "1px solid var(--border-soft)"}}><pre>{test.input}</pre>
                    <Button size="small" style={{ position: "absolute", top: 5, right: 5, color: "var(--accent-cool)" }} onClick={() => navigator.clipboard.writeText(test.input)}>
                        <ContentCopy fontSize="small" />
                    </Button>
                    </Paper>

                    <Typography variant="subtitle1" style={{ color: "var(--text)" }}>Sample Output {index + 1}</Typography>
                    <Paper style={{backgroundColor: "var(--bg)", color: "var(--text)", padding: "0.75rem",borderRadius: "16px", position: "relative", border: "1px solid var(--border-soft)"}}><pre>{test.expected_output}</pre>
                    <Button size="small" style={{ position: "absolute", top: 5, right: 5, color: "var(--accent-cool)" }} onClick={() => navigator.clipboard.writeText(test.expected_output)}>
                        <ContentCopy fontSize="small" />
                    </Button>
                    </Paper>
                </div>
                ))}
            </div>
            ) : (
            <Typography variant="body2" style={{ marginTop: "1rem", color: "var(--text-soft)" }}>
                No test cases available.
            </Typography>
            )}

        </Paper>

        {/* Submission form */}
        <Paper className="submission-sheet">
            <div className="submission-sheet-header">
              <Typography variant="h5" gutterBottom style={{ color: "var(--text-strong)", marginBottom: 0 }}>Submit Solution</Typography>
              <p>Choose a language, optionally load a local file, and send your final code for judging.</p>
            </div>
            <form onSubmit={handleSubmit}>
            <div className="submission-tool-grid">
              <div className="submission-tool-card">
                <h3>Language</h3>
                <p>Pick the runtime that matches your solution.</p>
                <FormControl
                    fullWidth
                    required
                    disabled={languagesLoading || languages.length === 0}
                >
                    <Select
                        id="language-select"
                        value={languageId}
                        onChange={(e) => setLanguageId(String(e.target.value))}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return languagesLoading ? "Loading languages..." : "Select language";
                          }

                          const selectedLanguage = languages.find((lang) => String(lang.id) === String(selected));
                          return selectedLanguage?.name || "Select language";
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 1,
                              borderRadius: "16px",
                              background: "var(--surface-overlay-strong)",
                              color: "var(--text)",
                              border: "1px solid var(--border-soft)",
                              boxShadow: "var(--shadow-lg)",
                            },
                          },
                        }}
                        sx={{
                          borderRadius: "16px",
                          background: "var(--surface-muted)",
                          color: "var(--text)",
                          ".MuiSelect-select": {
                            py: 1.1,
                          },
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--border-soft)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--border-focus)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--border-focus)",
                          },
                          ".MuiSvgIcon-root": {
                            color: "var(--text-soft)",
                          },
                        }}
                        required
                    >
                        <MenuItem value="" disabled>
                          Select language
                        </MenuItem>
                        {languages.map((lang) => (
                        <MenuItem key={lang.id} value={String(lang.id)}>{lang.name}</MenuItem>
                        ))}
                    </Select>
                    <FormHelperText
                      sx={{
                        marginLeft: "0.1rem",
                        color: languagesError ? "var(--danger)" : "var(--text-soft)",
                      }}
                    >
                      {languagesError || (languagesLoading
                        ? "Loading available languages."
                        : languages.length === 0
                          ? "No languages available right now."
                          : "Choose the language you want to submit with.")}
                    </FormHelperText>
                </FormControl>
              </div>

              <div className="submission-tool-card">
                <h3>Load from file</h3>
                <p>Import a local source file and keep editing before submission.</p>
                <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    className="submission-upload-button"
                    style={{ color: "var(--accent-cool)", borderColor: "color-mix(in srgb, var(--accent-cool) 35%, transparent)" }}
                >
                    Upload Code File
                    <input
                    type="file"
                    accept=".cpp,.java,.py,.c,.txt"
                    hidden
                    onChange={handleFileUpload}
                    />
                </Button>
                <div className="submission-file-name">
                  {uploadedFileName ? `Loaded file: ${uploadedFileName}` : "No file selected."}
                </div>
              </div>
            </div>

            <span className="submission-editor-label">Code Editor</span>

            <TextField
                fullWidth
                multiline
                minRows={10}
                variant="outlined"
                placeholder="Write your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ marginBottom: "1rem" }}
                InputProps={{
                  style: {
                    background: "var(--surface-muted)",
                    color: "var(--text)",
                    borderRadius: "16px",
                  },
                }}
                required
            />

            <div className="submission-footer">
              <div className="submission-status-note">
                Make sure your language and code are both ready before submitting.
              </div>
              <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  className="submission-primary-button"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))", color: "var(--accent-contrast)" }}
              >
                  {loading ? "Submitting..." : "Submit Solution"}
              </Button>
            </div>
            </form>

            {success && (
            <Typography className="submission-success">
                ✅ Submitted successfully! Verdict: {verdict}
                <Button
                style={{ marginLeft: "1rem", color: "var(--accent-cool)" }}
                onClick={() => navigate("/submissions/")}
                >
                Go to My Submissions
                </Button>
            </Typography>
            )}

            {error && (
            <Typography className="submission-error">
                ❌ {error}
            </Typography>
            )}
        </Paper>
        </div>
    );
};

export default ProblemDetails;
