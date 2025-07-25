import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const minute = 1/12;  // maybe 10 minutes?
const DISABLE_TIME_MS = minute * 60 * 1000;

interface Problem {
  id: string;
  text: string;
}

const App: React.FC = () => {

  // User study conditions: baseline, llm_all, llm_early, llm_laster
  const queryParams = new URLSearchParams(window.location.search);
  const condition = queryParams.get("condition") || "baseline";  // fallback to "baseline" as default
  const showGenerateButton = {
    B: condition === "llm_all" || condition === "llm_early",
    C: condition === "llm_all" || condition === "llm_early",
    D: condition === "llm_all" || condition === "llm_later",
    E: condition === "llm_all" || condition === "llm_later"
  };

  // State for each input in windows B-E
  const [inputB, setInputB] = useState('');
  const [inputC, setInputC] = useState('');
  const [inputD, setInputD] = useState('');
  const [inputE, setInputE] = useState('');
  
  // State for submitted ideas
  const [ideasB, setIdeasB] = useState<string[]>([]);
  const [ideasC, setIdeasC] = useState<string[]>([]);
  const [ideasD, setIdeasD] = useState<string[]>([]);
  const [ideasE, setIdeasE] = useState<string[]>([]);

  // State for enabling/disabling windows D and E
  const [windowDEnabled, setWindowDEnabled] = useState(false);
  const [windowEEnabled, setWindowEEnabled] = useState(false);
  
  // State for countdown timers
  const [windowDTimeLeft, setWindowDTimeLeft] = useState(DISABLE_TIME_MS);
  const [windowETimeLeft, setWindowETimeLeft] = useState(DISABLE_TIME_MS);

  // Refs for each ideas list
  const ideasBRef = useRef<HTMLDivElement>(null);
  const ideasCRef = useRef<HTMLDivElement>(null);
  const ideasDRef = useRef<HTMLDivElement>(null);
  const ideasERef = useRef<HTMLDivElement>(null);

  // For loading problems
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    async function loadProblems() {
      let { data, error } = await supabase
        .from('pr_problem')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error loading problems: ', error);
      } else {
        console.log("Problems from Supabase:", data);
        setProblems(data || []);
      }
    }
    loadProblems();
  }, []);

  const problem = problems[0];

  // Scroll to bottom when ideas change
  useEffect(() => {
    if (ideasBRef.current) {
      ideasBRef.current.scrollTop = ideasBRef.current.scrollHeight;
    }
  }, [ideasB]);

  useEffect(() => {
    if (ideasCRef.current) {
      ideasCRef.current.scrollTop = ideasCRef.current.scrollHeight;
    }
  }, [ideasC]);

  useEffect(() => {
    if (ideasDRef.current) {
      ideasDRef.current.scrollTop = ideasDRef.current.scrollHeight;
    }
  }, [ideasD]);
  
  useEffect(() => {
    if (ideasERef.current) {
      ideasERef.current.scrollTop = ideasERef.current.scrollHeight;
    }
  }, [ideasE]);

  // Enable D and E after 5 minutes, and update countdown every second
  useEffect(() => {
    if (windowDEnabled) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const timeLeft = Math.max(DISABLE_TIME_MS - elapsed, 0);
      setWindowDTimeLeft(timeLeft);
      if (timeLeft === 0) {
        setWindowDEnabled(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [windowDEnabled]);

  useEffect(() => {
    if (windowEEnabled) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const timeLeft = Math.max(DISABLE_TIME_MS - elapsed, 0);
      setWindowETimeLeft(timeLeft);
      if (timeLeft === 0) {
        setWindowEEnabled(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [windowEEnabled]);

  // Handler for Enter key in idea input
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setIdeas: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (e.key === 'Enter' && input.trim() !== '') {
      setIdeas(prev => [...prev, input.trim()]);
      setInput('');
      e.preventDefault();
    }
  };

  // Handler to remove an idea by index
  const handleRemoveIdea = (
    idx: number,
    ideas: string[],
    setIdeas: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setIdeas(ideas.filter((_, i) => i !== idx));
  };

  // Helper to format ms as mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calling OpenAI API
  //// Disabling the generation button while llm generates response
  const [isGenerating, setIsGenerating] = useState(false);

  //// Prompting llm
  const handleGenerate = async (
    windowID: "B" | "C" | "D" | "E",
    problemText: string | string[],
    ideas: any,
    setIdeas: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setIsGenerating(true);  // Disabling all buttons
    try {
      const response = await fetch(`${API_BASE_URL}/prompt_llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          window_id: windowID,
          problem: problemText,
          ideas: ideas,
        }),
      });
      const result = await response.json();
      if (result.text) {
        setIdeas(prev => [...prev, result.text]);
      }
    } catch (error) {
      console.error("Error calling backend:", error);
    } finally {
      setIsGenerating(false);  // Re-enabling the buttons
    }
  }


  // GUI
  return (
    <div className="App">
      <div className="grid-container">
        <div className="grid-item item-a">
          <div className="window-content">
            <h5 className="window-title">Problem Description</h5>
            <p className="window-body">
              {problem ? problem.text : 'Loading...'}
            </p>
            {/* <p className="window-body">The Sydney Opera House has experienced repeated incidents of unauthorized access, primarily by protesters who trespass onto the building's distinctive sail structures. These individuals typically aim to gain public and media attention by displaying banners or defacing the sails with slogans. Due to the building’s symbolic significance, heritage status, and high visibility, such incidents pose political and reputational risks. The protesters have exploited specific vulnerable points of access, compromising the site's security and public image. Addressing this issue requires solutions that balance security enhancement with the preservation of the Opera House’s cultural and architectural integrity.</p> */}
          </div>
        </div>
        <div className="grid-item item-b">
          <div className="window-content">
            <h5 className="window-title">What are the apparent problems?</h5>
            <p className="window-body">Read the problem description carefully and list problems you can identify.</p>
            <div className="window-ideas-list" ref={ideasBRef}>
              {ideasB.map((idea, idx) => (
                <div className="window-idea-box" key={idx}>
                  {idea}
                  <button className="window-idea-remove" onClick={() => handleRemoveIdea(idx, ideasB, setIdeasB)}>×</button>
                </div>
              ))}
            </div>
            <input
              className="window-input"
              type="text"
              value={inputB}
              onChange={e => setInputB(e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, inputB, setInputB, setIdeasB)}
              placeholder="Type your idea here..."
            />
            {showGenerateButton.B && (
              <button 
                className="window-generate-btn"
                onClick={() => handleGenerate("B", problem?.text || "", ideasB, setIdeasB)}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating ..." : "Generate"}
              </button>
            )}
          </div>
        </div>
        <div className="grid-item item-c">
          <div className="window-content">
            <h5 className="window-title">Why is this problem difficult to solve?</h5>
            <p className="window-body">Think about why the apparent problems are difficult to solve.</p>
            <div className="window-ideas-list" ref={ideasCRef}>
              {ideasC.map((idea, idx) => (
                <div className="window-idea-box" key={idx}>
                  {idea}
                  <button className="window-idea-remove" onClick={() => handleRemoveIdea(idx, ideasC, setIdeasC)}>×</button>
                </div>
              ))}
            </div>
            <input
              className="window-input"
              type="text"
              value={inputC}
              onChange={e => setInputC(e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, inputC, setInputC, setIdeasC)}
              placeholder="Type your idea here..."
            />
            {showGenerateButton.C && (
              <button 
                className="window-generate-btn"
                onClick={() => handleGenerate("C", problem?.text || "", { idea_b: ideasB, idea_c: ideasC }, setIdeasC)}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating ..." : "Generate"}
              </button>
            )}
          </div>
        </div>
        <div className="grid-item item-d" style={{ position: 'relative'}}>
          <div className="window-content" style={{ position: 'relative' }}>
            <h5 className="window-title">How else the problems can be approached?</h5>
            <p className="window-body">Brainstorm alterantive perspectives to address the problems.</p>
            <div className="window-ideas-list" ref={ideasDRef}>
              {ideasD.map((idea, idx) => (
                <div className="window-idea-box" key={idx}>
                  {idea}
                  <button className="window-idea-remove" onClick={() => handleRemoveIdea(idx, ideasD, setIdeasD)}>×</button>
                </div>
              ))}
            </div>
            <input
              className="window-input"
              type="text"
              value={inputD}
              onChange={e => setInputD(e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, inputD, setInputD, setIdeasD)}
              placeholder="Type your idea here..."
              disabled={!windowDEnabled}
            />
            {showGenerateButton.D && (
              <button 
                className="window-generate-btn"
                onClick={() => handleGenerate("D", problem?.text || "", { idea_d: ideasD, idea_e: ideasE }, setIdeasD)}
                disabled={!windowDEnabled || isGenerating}
              >
                {isGenerating ? "Generating ..." : "Generate"}
              </button>
            )}
          </div>
          {!windowDEnabled && (
            <div className="window-disabled-cover">
              <span className="window-disabled-message">This window will unlock in {formatTime(windowDTimeLeft)}</span>
            </div>
          )}
        </div>
        <div className="grid-item item-e" style={{ position: 'relative'}}>
          <div className="window-content" style={{ position: 'relative' }}>
            <h5 className="window-title">What could be potential solutions?</h5>
            <p className="window-body">Bainstorm solutions to alterantive problem frames you explored above.</p>
            <div className="window-ideas-list" ref={ideasERef}>
              {ideasE.map((idea, idx) => (
                <div className="window-idea-box" key={idx}>
                  {idea}
                  <button className="window-idea-remove" onClick={() => handleRemoveIdea(idx, ideasE, setIdeasE)}>×</button>
                </div>
              ))}
            </div>
            <input
              className="window-input"
              type="text"
              value={inputE}
              onChange={e => setInputE(e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, inputE, setInputE, setIdeasE)}
              placeholder="Type your idea here..."
              disabled={!windowEEnabled}
            />
            {showGenerateButton.E && (
              <button 
                className="window-generate-btn"
                onClick={() => handleGenerate("E", problem?.text || "", { idea_d: ideasD, idea_e: ideasE }, setIdeasE)}
                disabled={!windowEEnabled || isGenerating}
              >
                {isGenerating ? "Generating ..." : "Generate"}
              </button>
            )}
          </div>
          {!windowEEnabled && (
            <div className="window-disabled-cover">
              <span className="window-disabled-message">This window will unlock in {formatTime(windowETimeLeft)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
