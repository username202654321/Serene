# Scramjet research notes

Source: https://github.com/MercuryWorkshop/scramjet

The official repository describes Scramjet as an experimental interception-based web proxy designed to evade internet censorship and bypass arbitrary browser restrictions. Its architecture sandboxes arbitrary web content, bypasses CORS restrictions on loading websites, and instruments/debugs websites through interception, rewriting, and sandboxing techniques.

Serene will not implement or advertise bypass functionality. The uploaded specification explicitly limits browser/proxy use to content the user is authorized to access and forbids bypassing school, workplace, parental, authentication, geographic, security, or network access controls. In the static frontend scaffold, implement a modular browser service abstraction and a polished safe browser shell with clear unavailable/blocked states. Do not claim a fake Scramjet integration; do not copy repository source. A real Scramjet deployment would require a compatible service layer and server-side/proxy hosting, which is outside this static frontend-only phase.
