import { useState, useEffect } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CHANNEL_HANDLE = import.meta.env.VITE_YOUTUBE_CHANNEL_HANDLE || "ackcathedralyouthembu";

// Fetches every public video from the channel's uploads playlist via the
// YouTube Data API v3, sorted oldest to newest. Re-runs on every page load,
// so newly published videos appear automatically without any code changes.
export function useYouTubeVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      if (!API_KEY) {
        setError("YouTube isn't connected yet.");
        setLoading(false);
        return;
      }
      try {
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`
        );
        const channelData = await channelRes.json();
        if (channelData.error) throw new Error(channelData.error.message);
        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) throw new Error("Couldn't find the channel's uploads playlist.");

        let allItems = [];
        let pageToken = "";
        do {
          const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&pageToken=${pageToken}&key=${API_KEY}`
          );
          const playlistData = await playlistRes.json();
          if (playlistData.error) throw new Error(playlistData.error.message);
          allItems = allItems.concat(playlistData.items || []);
          pageToken = playlistData.nextPageToken || "";
        } while (pageToken && !cancelled);

        const mapped = allItems
          .filter(item => item.snippet?.resourceId?.videoId)
          .map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              "",
          }))
          .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

        if (!cancelled) {
          setVideos(mapped);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load videos.");
          setLoading(false);
        }
      }
    }

    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  return { videos, loading, error };
}
