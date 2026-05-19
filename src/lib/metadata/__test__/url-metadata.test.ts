import { describe, expect, test } from "bun:test";
import {
  fetchUrlMetadata,
  formatCompactCount,
  getSpotifyPlayerEmbedHtml,
  getSpotifyProviderEmbedHtml,
  getSpotifyProviderEmbedUri,
  getYoutubePlayerEmbedHtml,
  isChzzkProviderMetadata,
  isDiscordProviderMetadata,
  isGithubContributionsProviderMetadata,
  isSpotifyProviderMetadata,
  isTwitchProviderMetadata,
  isYoutubeProviderMetadata,
  MetadataFetchError,
} from "@/lib/metadata/url-metadata";

describe("fetchUrlMetadata", () => {
  test("fetches normalized metadata from the harune metadata API", async () => {
    const originalFetch = globalThis.fetch;
    let requestUrl = "";
    let requestHeaders: HeadersInit | undefined;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestHeaders = init?.headers;

      return new Response(
        JSON.stringify({
          description: "Page description",
          favicon: "https://example.com/favicon.ico",
          fetchedAt: "2026-05-12T00:00:00.000Z",
          image: "https://example.com/og.png",
          siteName: "Example Site",
          title: "OG Title",
          domain: "example.com",
          url: "https://example.com/post",
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://example.com/post");
      const headers = new Headers(requestHeaders);

      expect(requestUrl).toBe(
        "https://api.harune.me/metadata?url=https%3A%2F%2Fexample.com%2Fpost"
      );
      expect(headers.get("accept")).toBe("application/json");
      expect(metadata).toEqual({
        description: "Page description",
        favicon: "https://example.com/favicon.ico",
        image: "https://example.com/og.png",
        domain: "example.com",
        siteName: "Example Site",
        title: "OG Title",
        url: "https://example.com/post",
        provider: null,
        providerMetadata: null,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves github contribution metadata", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "GitHub profile",
          favicon: "https://github.com/favicon.ico",
          fetchedAt: "2026-05-12T00:00:00.000Z",
          image: null,
          siteName: "GitHub",
          title: "octocat",
          domain: "github.com",
          url: "https://github.com/octocat",
          provider: "github",
          providerMetadata: {
            provider: "github",
            viewType: "github_contributions_60d",
            fetchedAt: "2026-05-12T00:00:00.000Z",
            payload: {
              login: "octocat",
              name: "The Octocat",
              avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
              profileUrl: "https://github.com/octocat",
              rangeStart: "2026-04-12",
              rangeEnd: "2026-05-12",
              totalContributions: 128,
              days: [
                {
                  date: "2026-04-12",
                  contributionCount: 0,
                  contributionLevel: "NONE",
                  color: "#ebedf0",
                  weekday: 0,
                },
                {
                  date: "2026-04-13",
                  contributionCount: 3,
                  contributionLevel: "FIRST_QUARTILE",
                  color: "#9be9a8",
                  weekday: 1,
                },
              ],
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://github.com/octocat");

      expect(metadata.provider).toBe("github");
      expect(metadata.domain).toBe("github.com");
      expect(isGithubContributionsProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "github",
        viewType: "github_contributions_60d",
        fetchedAt: "2026-05-12T00:00:00.000Z",
        payload: {
          login: "octocat",
          name: "The Octocat",
          avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
          profileUrl: "https://github.com/octocat",
          rangeStart: "2026-04-12",
          rangeEnd: "2026-05-12",
          totalContributions: 128,
          days: [
            {
              date: "2026-04-12",
              contributionCount: 0,
              contributionLevel: "NONE",
              color: "#ebedf0",
              weekday: 0,
            },
            {
              date: "2026-04-13",
              contributionCount: 3,
              contributionLevel: "FIRST_QUARTILE",
              color: "#9be9a8",
              weekday: 1,
            },
          ],
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves youtube provider metadata and compacts subscriber counts", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "YouTube channel",
          favicon: "https://www.youtube.com/favicon.ico",
          fetchedAt: "2026-05-12T00:00:00.000Z",
          image: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
          siteName: "YouTube",
          title: "Harune",
          domain: "youtube.com",
          url: "https://www.youtube.com/@harune",
          provider: "youtube",
          providerMetadata: {
            provider: "youtube",
            viewType: "youtube_channel",
            fetchedAt: "2026-05-12T00:00:00.000Z",
            payload: {
              snippet: {
                title: "Harune",
                description: "YouTube channel",
                thumbnails: {
                  high: {
                    url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
                  },
                },
              },
              thumbnails: {
                high: {
                  url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
                },
              },
              statistics: {
                subscriberCount: "1253400",
              },
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://www.youtube.com/@harune");

      expect(metadata.provider).toBe("youtube");
      expect(metadata.domain).toBe("youtube.com");
      expect(isYoutubeProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "youtube",
        viewType: "youtube_channel",
        fetchedAt: "2026-05-12T00:00:00.000Z",
        payload: {
          snippet: {
            title: "Harune",
            description: "YouTube channel",
            thumbnails: {
              high: {
                url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
              },
            },
          },
          thumbnails: {
            high: {
              url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
            },
          },
          statistics: {
            subscriberCount: "1253400",
          },
        },
      });
      expect(formatCompactCount("999")).toBe("999");
      expect(formatCompactCount("1000")).toBe("1K");
      expect(formatCompactCount("1253400")).toBe("1.3M");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves youtube video provider metadata and accepts player embeds", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "YouTube video",
          favicon: "https://www.youtube.com/favicon.ico",
          fetchedAt: "2026-05-19T00:00:00.000Z",
          image: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          siteName: "YouTube",
          title: "Never Gonna Give You Up",
          domain: "youtube.com",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          provider: "youtube",
          providerMetadata: {
            provider: "youtube",
            viewType: "youtube_video",
            fetchedAt: "2026-05-19T00:00:00.000Z",
            payload: {
              videoId: "dQw4w9WgXcQ",
              channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
              channelTitle: "Rick Astley",
              snippet: {
                title: "Never Gonna Give You Up",
                description: "Music video",
              },
              statistics: {
                viewCount: 123456789,
                likeCount: 9876543,
                commentCount: 12345,
              },
              player: {
                embedHtml: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
                embedWidth: 640,
                embedHeight: 360,
              },
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      expect(metadata.provider).toBe("youtube");
      expect(metadata.domain).toBe("youtube.com");
      expect(isYoutubeProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(getYoutubePlayerEmbedHtml(metadata.providerMetadata?.payload)).toBe(
        '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'
      );
      expect(metadata.providerMetadata).toEqual({
        provider: "youtube",
        viewType: "youtube_video",
        fetchedAt: "2026-05-19T00:00:00.000Z",
        payload: {
          videoId: "dQw4w9WgXcQ",
          channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
          channelTitle: "Rick Astley",
          snippet: {
            title: "Never Gonna Give You Up",
            description: "Music video",
          },
          statistics: {
            viewCount: 123456789,
            likeCount: 9876543,
            commentCount: 12345,
          },
          player: {
            embedHtml: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
            embedWidth: 640,
            embedHeight: 360,
          },
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves spotify oembed provider metadata and accepts iframe html", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "Spotify artist",
          favicon: "https://open.spotify.com/favicon.ico",
          fetchedAt: "2026-05-19T00:00:00.000Z",
          image: "https://i.scdn.co/image/ab67616d0000b273000000000000000000000000",
          siteName: "Spotify",
          title: "Mingginyu",
          domain: "open.spotify.com",
          url: "https://open.spotify.com/artist/29UQ130XMQDR55X4Rmjapd",
          provider: "spotify",
          providerMetadata: {
            provider: "spotify",
            viewType: "spotify_oembed",
            fetchedAt: "2026-05-19T00:00:00.000Z",
            payload: {
              html: '<iframe style="border-radius: 12px" width="100%" height="352" title="Spotify Embed: Mingginyu" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/artist/29UQ130XMQDR55X4Rmjapd?utm_source=oembed"></iframe>',
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata(
        "https://open.spotify.com/artist/29UQ130XMQDR55X4Rmjapd"
      );

      expect(metadata.provider).toBe("spotify");
      expect(metadata.domain).toBe("open.spotify.com");
      expect(isSpotifyProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(getSpotifyPlayerEmbedHtml(metadata.providerMetadata?.payload)).toBe(
        '<iframe style="border-radius: 12px" width="100%" height="352" title="Spotify Embed: Mingginyu" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/artist/29UQ130XMQDR55X4Rmjapd?utm_source=oembed"></iframe>'
      );
      expect(
        getSpotifyProviderEmbedUri(
          metadata.providerMetadata,
          "https://open.spotify.com/artist/29UQ130XMQDR55X4Rmjapd"
        )
      ).toBe("spotify:artist:29UQ130XMQDR55X4Rmjapd");
      expect(getSpotifyProviderEmbedHtml(metadata.providerMetadata)).toBe(
        '<iframe style="border-radius: 12px" width="100%" height="352" title="Spotify Embed: Mingginyu" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/artist/29UQ130XMQDR55X4Rmjapd?utm_source=oembed"></iframe>'
      );
      expect(metadata.providerMetadata).toEqual({
        provider: "spotify",
        viewType: "spotify_oembed",
        fetchedAt: "2026-05-19T00:00:00.000Z",
        payload: {
          html: '<iframe style="border-radius: 12px" width="100%" height="352" title="Spotify Embed: Mingginyu" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/artist/29UQ130XMQDR55X4Rmjapd?utm_source=oembed"></iframe>',
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("does not return spotify embed html without oembed provider metadata", () => {
    expect(
      getSpotifyProviderEmbedHtml({
        provider: "spotify",
        viewType: "generic_html",
        fetchedAt: "2026-05-19T00:00:00.000Z",
        payload: {
          title: "Spotify fallback",
        },
      })
    ).toBeNull();

    expect(getSpotifyProviderEmbedHtml(null)).toBeNull();
  });

  test("preserves twitch provider metadata and compacts follower counts", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "Twitch channel",
          favicon: "https://static-cdn.jtvnw.net/favicon.ico",
          fetchedAt: "2026-05-19T00:00:00.000Z",
          image: "https://static-cdn.jtvnw.net/user.png",
          siteName: "Twitch",
          title: "TwitchDev",
          domain: "twitch.tv",
          url: "https://www.twitch.tv/twitchdev",
          provider: "twitch",
          providerMetadata: {
            provider: "twitch",
            viewType: "twitch_channel",
            fetchedAt: "2026-05-19T00:00:00.000Z",
            payload: {
              broadcasterId: "141981764",
              broadcasterLogin: "twitchdev",
              broadcasterName: "TwitchDev",
              displayName: "TwitchDev",
              description: "Supporting third-party developers.",
              profileImageUrl: "https://static-cdn.jtvnw.net/user.png",
              offlineImageUrl: "https://static-cdn.jtvnw.net/offline.png",
              followerCount: 1234567,
              viewCount: 5980557,
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://www.twitch.tv/twitchdev");

      expect(metadata.provider).toBe("twitch");
      expect(metadata.domain).toBe("twitch.tv");
      expect(isTwitchProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "twitch",
        viewType: "twitch_channel",
        fetchedAt: "2026-05-19T00:00:00.000Z",
        payload: {
          broadcasterId: "141981764",
          broadcasterLogin: "twitchdev",
          broadcasterName: "TwitchDev",
          displayName: "TwitchDev",
          description: "Supporting third-party developers.",
          profileImageUrl: "https://static-cdn.jtvnw.net/user.png",
          offlineImageUrl: "https://static-cdn.jtvnw.net/offline.png",
          followerCount: 1234567,
          viewCount: 5980557,
        },
      });
      expect(formatCompactCount(1234567)).toBe("1.2M");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves discord provider metadata and compacts member counts", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "Discord invite",
          favicon: "https://cdn.discordapp.com/favicon.ico",
          fetchedAt: "2026-05-19T00:00:00.000Z",
          image: "https://cdn.discordapp.com/icons/123456789012345678/guild_icon.png?size=256",
          siteName: "Discord",
          title: "Harune Community",
          domain: "discord.gg",
          url: "https://discord.gg/abc123",
          provider: "discord",
          providerMetadata: {
            provider: "discord",
            viewType: "discord_invite",
            fetchedAt: "2026-05-19T00:00:00.000Z",
            payload: {
              code: "abc123",
              guildId: "123456789012345678",
              guildName: "Harune Community",
              guildDescription: "A friendly place",
              iconUrl:
                "https://cdn.discordapp.com/icons/123456789012345678/guild_icon.png?size=256",
              memberCount: 12345,
              presenceCount: 321,
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata("https://discord.gg/abc123");

      expect(metadata.provider).toBe("discord");
      expect(metadata.domain).toBe("discord.gg");
      expect(isDiscordProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "discord",
        viewType: "discord_invite",
        fetchedAt: "2026-05-19T00:00:00.000Z",
        payload: {
          code: "abc123",
          guildId: "123456789012345678",
          guildName: "Harune Community",
          guildDescription: "A friendly place",
          iconUrl: "https://cdn.discordapp.com/icons/123456789012345678/guild_icon.png?size=256",
          memberCount: 12345,
          presenceCount: 321,
        },
      });
      expect(formatCompactCount(12345)).toBe("12.3K");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("preserves chzzk provider metadata and compacts follower counts", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          description: "CHZZK channel",
          favicon: "https://chzzk.naver.com/favicon.ico",
          fetchedAt: "2026-05-19T04:48:46.085Z",
          image: "https://nng-phinf.pstatic.net/channel.png",
          siteName: "CHZZK",
          title: "한동숙",
          domain: "chzzk.naver.com",
          url: "https://chzzk.naver.com/75cbf189b3bb8f9f687d2aca0d0a382b",
          provider: "chzzk",
          providerMetadata: {
            provider: "chzzk",
            viewType: "chzzk_channel",
            fetchedAt: "2026-05-19T04:48:46.085Z",
            payload: {
              channelId: "75cbf189b3bb8f9f687d2aca0d0a382b",
              channelName: "한동숙",
              channelImageUrl: "https://nng-phinf.pstatic.net/channel.png",
              followerCount: 374700,
              verifiedMark: true,
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch;

    try {
      const metadata = await fetchUrlMetadata(
        "https://chzzk.naver.com/75cbf189b3bb8f9f687d2aca0d0a382b"
      );

      expect(metadata.provider).toBe("chzzk");
      expect(metadata.domain).toBe("chzzk.naver.com");
      expect(isChzzkProviderMetadata(metadata.providerMetadata)).toBe(true);
      expect(metadata.providerMetadata).toEqual({
        provider: "chzzk",
        viewType: "chzzk_channel",
        fetchedAt: "2026-05-19T04:48:46.085Z",
        payload: {
          channelId: "75cbf189b3bb8f9f687d2aca0d0a382b",
          channelName: "한동숙",
          channelImageUrl: "https://nng-phinf.pstatic.net/channel.png",
          followerCount: 374700,
          verifiedMark: true,
        },
      });
      expect(formatCompactCount(374700)).toBe("374.7K");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("surfaces metadata API errors with the upstream status", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: "invalid_url",
          message: "Invalid URL.",
          details: {
            url: "notaurl",
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 400,
        }
      )) as typeof fetch;

    try {
      let error: unknown;

      try {
        await fetchUrlMetadata("notaurl");
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error instanceof MetadataFetchError).toBe(true);

      const metadataError = error as MetadataFetchError;

      expect(metadataError.status).toBe(400);
      expect(metadataError.body).toEqual({
        error: "invalid_url",
        message: "Invalid URL.",
        details: {
          url: "notaurl",
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("normalizes nested metadata API errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "bad_gateway",
            message: "target responded with an error status",
            details: {
              status: 429,
            },
          },
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 502,
        }
      )) as typeof fetch;

    try {
      let error: unknown;

      try {
        await fetchUrlMetadata("https://music.youtube.com/watch?v=tlcEurH9Cpg");
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error instanceof MetadataFetchError).toBe(true);

      const metadataError = error as MetadataFetchError;

      expect(metadataError.status).toBe(502);
      expect(metadataError.body).toEqual({
        error: "bad_gateway",
        message: "target responded with an error status",
        details: {
          status: 429,
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
