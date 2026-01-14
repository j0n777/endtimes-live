# Radio Frequencies Guide - End Times Monitor

## Quick Reference

This guide explains how to use the global radio frequency database in the COMMS panel.

---

## Understanding IARU Regions

The International Amateur Radio Union (IARU) divides the world into 3 regions:

- **Region 1**: Europe, Africa, Middle East, Northern Asia
- **Region 2**: North & South America
- **Region 3**: Asia-Pacific (Japan, China, Australia, etc.)

---

## License Types Explained

### ✅ License-Free
- **PMR446 (Europe)**: 0.5W max, 446 MHz band, no license needed
- **CB Radio**: Varies by country (typically 27 MHz, 4W max in US)
- **NAVTEX/WWV**: Receive-only broadcasts

### 🎓 Amateur Radio
- **Requirement**: Pass written exam for your country
  - **USA**: FCC Technician, General, or Extra license
  - **Europe**: CEPT license (recognized across EU)
  - **Brazil**: ANATEL license
  - **Australia**: ACMA license
- **Access**: All HF/VHF/UHF amateur bands
- **Power**: Up to 1500W (USA), varies by country

### 🚢 Maritime
- **Requirement**: Marine radio license (e.g., Short Range Certificate)
- **Frequencies**: VHF Ch 16 (156.8 MHz), HF distress frequencies
- **Use**: Mandatory for vessels

### ✈️ Aviation
- **Requirement**: Pilot license or air traffic controller
- **Frequencies**: 121.5 MHz (emergency), air traffic control bands
- **Note**: MONITOR ONLY unless you're in an aircraft emergency

### 📻 GMRS (US Only)
- **Requirement**: FCC GMRS license (no exam, $35 fee, 10-year validity)
- **Frequencies**: 462-467 MHz (22 channels)
- **Power**: Up to 50W on repeaters

---

## How to Use the COMMS Panel

### Filters

1. **IARU Region**: Filter by regulatory region
   - Select "Global Emergency" to see worldwide distress frequencies
   - Select specific regions to focus on your area

2. **Continent**: Geographic filter
   - Useful for finding regional networks (HAMNET in Africa, RENER in Brazil, etc.)

3. **License Type**: Shows what you can legally use
   - Start with "License-Free" if you don't have permits
   - Filter by "Amateur" if you're a licensed ham

4. **Frequency Band**: 
   - **HF (3-30 MHz)**: Long-distance, bounces off ionosphere, night works better
   - **VHF (30-300 MHz)**: Regional, line-of-sight + some refraction
   - **UHF (300 MHz-3 GHz)**: Local, good urban penetration, short range

5. **Emergency Only**: Shows critical emergency frequencies
   - IARU EmComm centers of activity
   - Maritime/Aviation distress
   - Regional emergency nets (HAMNET, Hurricane Watch Net, etc.)

6. **Search**: Find by frequency, name, network, or keyword

---

## Critical Emergency Frequencies (Worldwide)

These should be programmed into any emergency radio:

| Frequency | Purpose | Notes |
|-----------|---------|-------|
| **14.300 MHz USB** | Primary international amateur emergency | Recognized globally, ±20 kHz activity zone |
| **156.8 MHz FM** | Marine VHF Ch 16 | Mandatory monitoring on all vessels |
| **121.5 MHz AM** | Aviation emergency | Aircraft only, monitor if near coast/airport |
| **146.52 MHz FM** | US national simplex calling | Primary US ham frequency |
| **446.006 MHz FM** | PMR446 Ch 1 (Europe) | License-free emergency calling |

---

## Propagation Basics

### HF Bands (Best for Long Distance)
- **Night**: 80m (3.5 MHz), 40m (7MHz) - up to 1000+ miles
- **Day**: 20m (14 MHz), 17m (18 MHz), 15m (21 MHz) - worldwide
- **60m (5.357 MHz)**: Excellent for regional NVIS (500 miles), works day/night

### VHF/UHF (Local/Regional)
- Mostly line-of-sight (5-50 miles depending on antenna height)
- Repeaters extend range significantly
- VHF better for rural, UHF better for urban (penetrates buildings)

---

## Programming Your Radio

### For Baofeng UV-5R or Similar:
1. Install CHIRP software (free)
2. Export frequencies from End Times Monitor as CSV (future feature)
3. Program channels with CTCSS tones where specified
4. Label channels clearly (e.g., "PMR Ch1 Emergency", "20m TAPRN")

### Manual Programming:
- Focus on **emergency frequencies first**
- Add local repeaters for your area
- Program at least one HF frequency (14.300 MHz if you have HF capability)

---

## Legal & Safety Notes

### ⚠️ Critical Rules

1. **DO NOT TRANSMIT** on frequencies you're not licensed for, **EXCEPT**:
   - Immediate threat to life or property
   - No other means of communication available
   - Example: You're lost in wilderness, injured, no cell service

2. **LISTEN FIRST**: 
   - Monitor before transmitting
   - Don't interrupt emergency traffic
   - Keep transmissions brief

3. **License Check**:
   - Amateur frequencies: Need ham license
   - GMRS (US): Need GMRS license (no exam)
   - PMR446 (Europe): License-free (0.5W max)
   - CB: Generally license-free (check your country)
   - Marine/Aviation: Specific licenses required

4. **Power Limits**:
   - Use minimum power necessary
   - License-free services have strict power limits
   - Don't exceed license class power limits

---

## Public Monitoring Guide (Receive-Only)

New to the monitors? Here is how to listen to the new public safety and utility bands:

### 🌦️ Weather & Satellites
- **NOAA Weather Radio (162.400 - 162.550 MHz)**:
  - Requires: Standard weather radio or any VHF scanner.
  - Usage: Constant weather updates. Use "SAME" codes to silence radio until alert for your county.
- **NOAA Satellites (137 MHz)**:
  - Requires: **SDR (Software Defined Radio)** + Laptop + Dipole Antenna.
  - Usage: Decode live weather images from space as satellites pass overhead.

### ✈️ Aviation (118-137 MHz)
- **Voice (ATC)**: AM Mode (not FM!). Listen to Pilot-Tower comms.
- **ACARS (Digital)**: 131.550 MHz. Requires SDR + decoding software to see text messages from planes.
- **Military Air (225-400 MHz)**: Unencrypted comms often found on training routes.

### 🚔 Public Safety (Police/Fire/EMS)
- **VHF/UHF (Analog)**: Older rural systems. Any scanner works.
- **P25 Digital (City/State)**: Requires **Digital Scanner** (e.g., Uniden SDS100) or SDR.
- **Encryption**: Many SWAT/Tactical channels are encrypted (cannot be monitored). Dispatch is often clear.

### 🚂 Railroads (160-161 MHz)
- **Voice**: Crew-to-Dispatch. Listen for milepost reports to track train locations.
- **EOT (End of Train)**: Data bursts ("chirps") on 452/457 MHz indicate nearby trains.

### 🌍 Shortwave Broadcast
- **Stations**: BBC, VOA, Radio China, etc.
- **Purpose**: Government perspective news, emergency info when internet is cut.
- **Equipment**: Shortwave receiver (Tecsun, Sony) or HF Transceiver.

---

## Recommended Equipment

### Beginners (License-Free)
- **Europe**: PMR446 handheld (Midland, Motorola)
- **USA**: CB radio (Cobra, Midland) or GMRS handheld (after getting license)
- **Scanner**: Uniden Bearcat BC125AT (Analog Aviation/Rail/Legacy Public Safety)

### Amateur Radio (Licensed)
- **Handheld**: Baofeng UV-5R (budget), Yaesu FT-60R (quality)
- **Mobile**: Yaesu FT-7900R (dual-band VHF/UHF)
- **HF Base**: Icom IC-7300 (excellent beginner HF rig)

### Advanced Monitoring (SDR)
- **RTL-SDR v3**: ~$30 USB dongle. Connects to PC/Android.
- **Capabilities**: Listen to EVERYTHING (Police P25, Aircraft, Satellites, ADSB flight tracking).
- **Software**: SDR++, HD-SDR (Free).

---

## Emergency Operating Procedures

### Making a Distress Call (Amateur Radio)

1. **Choose frequency**: 
   - 14.300 MHz USB (international, daytime)
   - 7.110 MHz LSB (regional, night)
   - Local VHF simplex or repeater

2. **Transmit**:
   ```
   "MAYDAY MAYDAY MAYDAY
   This is [your callsign or name]
   [Your location]
   [Nature of emergency]
   [Assistance needed]
   Over."
   ```

3. **Repeat** if no response
4. **Listen** for instructions
5. **Stay calm**, speak clearly

### Maritime Distress (VHF Ch 16)
- Press DSC distress button (if equipped)
- Voice: "MAYDAY MAYDAY MAYDAY, this is [vessel name]..."
- Include: Position, number of people, nature of distress

---

## Networks & Nets

### North America
- **TAPRN**: American Prepper Radio Network (7.242 MHz, 14.242 MHz)
- **SHARES**: US government emergency (6.765 MHz, Wed 1600 UTC)
- **MARS**: Military Auxiliary Radio System (13.927 MHz)
- **Hurricane Watch Net**: Atlantic hurricanes (14.325 MHz)

### South America
- **RENER (Brazil)**: Emergency network on 70cm band
- Regional nets on 7.050 MHz, 14.270 MHz

### Europe
- **PMR446 Ch 1**: Informal emergency calling
- Regional IARU R1 emergency: 3.760 MHz, 7.110 MHz

### Africa
- **HAMNET (South Africa)**: Emergency communications network
- SADC frequencies: 3.760, 7.110, 14.300 MHz

### Asia-Pacific
- **JARL Emergency**: Japan (145.00 MHz, 145.50 MHz, 433.0 MHz)
- Australia calling: 146.500 MHz (VHF), 50.200 MHz (6m)

---

## Resources

### Getting Licensed (Amateur Radio)
- **USA**: https://www.arrl.org/getting-licensed
- **UK/Europe**: https://rsgb.org/main/operating/licensing/
- **Brazil**: ANATEL (Liga de Amadores Brasileiros)
- **Australia**: https://www.wia.org.au/licenses/

### Study Materials
- **Free**: HamStudy.org, HamTestOnline.com
- **Apps**: Ham Radio Prep (iOS/Android)
- **Books**: ARRL License Manual

### Organizations
- **ARRL** (USA): arrl.org
- **IARU**: iaru.org
- **RSGB** (UK): rsgb.org
- **JARL** (Japan): jarl.org
- **WIA** (Australia): wia.org.au

---

## FAQ

**Q: Can I use these frequencies without a license in an emergency?**
A: Yes, in a genuine life-threatening emergency where no other communication is available. This is recognized internationally. However, false emergencies carry serious penalties.

**Q: What's the best frequency for global communication?**
A: **14.300 MHz USB** during daytime. It's the primary international amateur emergency frequency. At night, use **7.110 MHz LSB** (Region 1/3) or **7.240 MHz LSB** (Region 2).

**Q: I don't have a ham license. What can I use?**
A: 
- **Europe**: PMR446 (446 MHz, license-free)
- **USA**: CB Radio (27 MHz, license-free) or get GMRS license (no exam)
- **Monitoring**: You can LISTEN to any frequency (except encrypted government/military)

**Q: How far can I communicate?**
A: 
- **VHF/UHF**: 5-50 miles (line of sight + terrain)
- **HF**: Worldwide (ionosphere skip) - 3000+ miles on 20m during day
- **NVIS (5.357 MHz)**: Reliable 500 miles (good for regional nets)

**Q: What's the difference between FM and SSB?**
A: 
- **FM**: Used on VHF/UHF, better audio quality, more power hungry
- **SSB** (USB/LSB): Used on HF, much longer range, battery efficient

**Q: Can I use my Baofeng on GMRS?**
A: Only if it's GMRS-certified. Regular Baofeng UV-5R is for amateur radio only (requires ham license in US). There are GMRS-specific Baofengs available.

---

**Last Updated**: January 2026 | **Data Source**: IARU Band Plans, ARRL, National Regulatory Agencies
