# thrives-ps3-cyber-incident-priority-engine
A system that aims to help decide what cyber incident to address first.

##Problem Statement:
PS-03
Cyber Incident Prioritization Engine
A security team receives 100 alerts in a single shift — failed logins, malware detections, port scans, data exfiltration, suspicious emails, brute-force attempts. They cannot investigate everything simultaneously, and the loudest alert is rarely the most dangerous one. Build a system that decides which incident the team should investigate first.
SCORING FACTORS
• Severity
• Asset importance
• Number of affected users
• Data sensitivity
• Attack confidence
• Business impact
CHALLENGE
Build the scoring engine
The queue is the product. Feed the engine a mixed batch of alerts and return a ranked list, not a single verdict — then justify why the incident at the top outranks the one below it. This tests algorithmic thinking: weight design, normalisation across factors on different scales, and sensible tie-breaking.
