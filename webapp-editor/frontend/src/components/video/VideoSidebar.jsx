import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { TitleEditor } from "../Sidebar";
import { videoSummary } from "../../video/format";

function StatusIcon({ video }) {
  if (video.status === "downloading" || video.status === "transcribing") {
    return (
      <CircularProgress
        size={18}
        variant={video.progress == null ? "indeterminate" : "determinate"}
        value={(video.progress ?? 0) * 100}
        color={video.status === "transcribing" ? "secondary" : "primary"}
      />
    );
  }
  if (video.status === "error") return <ErrorOutlineIcon color="error" fontSize="small" />;
  return video.source === "youtube" ? <YouTubeIcon fontSize="small" /> : <MovieOutlinedIcon fontSize="small" />;
}

/** "Import video" button and the imported videos, one list item each. */
export default function VideoSidebar({ videos, currentId, onSelect, onImport, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <Stack sx={{ height: "100%", p: 1.5 }}>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={onImport} sx={{ mb: 1 }}>
        Import video
      </Button>

      <Box sx={{ flex: 1, overflowY: "auto", mx: -0.5 }}>
        <List dense>
          {videos.map((v) => {
            const editing = v.id === editingId;
            const active = v.id === currentId;
            return (
              <ListItemButton
                key={v.id}
                selected={active}
                onClick={(e) => (editing ? e.stopPropagation() : onSelect(v.id))}
                onDoubleClick={() => setEditingId(v.id)}
                disableRipple={editing}
                sx={{
                  borderRadius: 1,
                  gap: 0.25,
                  "&:hover .actions, &:focus-within .actions": { visibility: "visible" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: "text.secondary" }}>
                  <StatusIcon video={v} />
                </ListItemIcon>
                {editing ? (
                  <TitleEditor
                    initial={v.title}
                    label="Video title"
                    onSave={(title) => {
                      setEditingId(null);
                      onRename(v.id, title);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <ListItemText
                      primary={v.title}
                      secondary={videoSummary(v)}
                      title={v.title}
                      slotProps={{
                        primary: { noWrap: true },
                        secondary: { noWrap: true, color: v.status === "error" ? "error" : "text.secondary" },
                      }}
                    />
                    <Box
                      className="actions"
                      sx={{ display: "flex", flexShrink: 0, visibility: active ? "visible" : "hidden" }}
                    >
                      <Tooltip title="Rename">
                        <IconButton
                          size="small"
                          aria-label="Rename video"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(v.id);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label="Delete video"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(v);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </ListItemButton>
            );
          })}
        </List>
        {videos.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            No videos yet.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
