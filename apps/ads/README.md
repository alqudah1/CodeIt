# Ads, made from the real app

`ad.html` is one ad. `render.cjs` renders it at Instagram's three sizes
(feed 4:5, story 9:16, square 1:1) with real screenshots of the app in the
phones. Nothing in the picture is a mock-up, so the ad never promises a screen
the child will not see.

    node apps/ads/render.cjs <out dir> <map.png> <home.png>

The screenshots are the app at 390px wide, taken at 2x (780px), signed in as a
child: the lesson map around the stop they are on, and Home with today's
Python quest and the progress panel. Any two screens work.

`fonts/` holds the app's own fonts (Baloo 2 800, Nunito 800 and 900) from the
`@fontsource` packages, so the render needs no network. The logo is
`public/brand/codeit-logo-trimmed.png`.

## Copy that goes with it (Meta Ads)

Primary text: Python for ages 8 to 14, like a game. A map of 31 lessons, a
two-minute Python quest every day, and games they make themselves. Free to
start, nothing to install.

Headline: Python in your pocket. Like a game.

Description: Free to start. Plus is CA$12 a month, cancel any time.

Button: Learn more. Destination: https://codeitlearn.com/go?utm_source=ig&utm_medium=paid&utm_campaign=pocket
