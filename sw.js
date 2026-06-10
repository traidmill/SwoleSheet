// Ingen cachning — wrappern ska alltid hämta färskt; krävs bara för PWA-installerbarhet.
self.addEventListener('fetch', function () {});
