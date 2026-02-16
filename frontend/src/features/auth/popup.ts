export function openPopup(url: string, title: string, w = 500, h = 600) {
  const dualScreenLeft = window.screenLeft ?? window.screenX;

  const dualScreenTop = window.screenTop ?? window.screenY;

  const width =
    window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;

  const height =
    window.innerHeight ??
    document.documentElement.clientHeight ??
    screen.height;

  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;

  return window.open(
    url,
    title,
    `
	    width=${w},
	    height=${h},
	    top=${top},
	    left=${left},
	    popup=yes,
	    toolbar=no,
	    menubar=no,
	    location=no,
	    status=no,
	    resizable=yes,
	    scrollbars=yes
	  `
  );
}
