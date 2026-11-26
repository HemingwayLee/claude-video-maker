import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import ThemeToggle from "./components/ThemeToggle";
import ChatPage from "./pages/ChatPage";
import AnimationOptionsPage from "./pages/AnimationOptionsPage";
import GeneratedVideosPage from "./pages/GeneratedVideosPage";
import VideoEditingPage from "./pages/VideoEditingPage";

// Add more tabs here: { value: "editor", label: "Editor" } plus a matching <Route>.
const TABS = [
  { value: "claude", label: "Claude Code" },
  { value: "video", label: "Video Editing" },
  { value: "animation-options", label: "Animation making options" },
  { value: "generated", label: "Generated videos" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = TABS.find((t) => location.pathname.startsWith(`/${t.value}`))?.value ?? "claude";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>
            webapp-editor
          </Typography>
          <Tabs
            value={section}
            onChange={(_, v) => navigate(`/${v}`)}
            variant="scrollable"
            sx={{ flex: 1, minWidth: 0, minHeight: 48, "& .MuiTab-root": { minHeight: 48 } }}
          >
            {TABS.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} />
            ))}
          </Tabs>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Chat stays mounted while hidden so a streaming reply isn't interrupted by switching tabs. */}
      <Box sx={{ display: section === "claude" ? "flex" : "none", flex: 1, minHeight: 0 }}>
        <ChatPage active={section === "claude"} />
      </Box>

      <Routes>
        <Route path="/" element={<Navigate to="/claude" replace />} />
        <Route path="/claude" element={null} />
        <Route
          path="/video/*"
          element={
            <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
              <VideoEditingPage />
            </Box>
          }
        />
        <Route
          path="/animation-options"
          element={
            <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
              <AnimationOptionsPage />
            </Box>
          }
        />
        <Route
          path="/generated/*"
          element={
            <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
              <GeneratedVideosPage />
            </Box>
          }
        />
        <Route path="*" element={<Navigate to="/claude" replace />} />
      </Routes>
    </Box>
  );
}
