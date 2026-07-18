# How To Install

## Step One
Ensure you have [Node.js](https://nodejs.org/en/download/) installed on your system. 

## Step Two
Use Git to clone the repository:  
`git clone https://github.com/Aaron-Massey/SecureChat:` 

## Step Three
Navigate to 'SecureChat' directory and execute:
`npm install`

## Step Four (optional)
Customize the ports within `config.json` 

## Step Five
Execute `npm start` 

## Step Six  
Open `http://localhost:3000` using your browser of choice

## Step Seven  
Find your current machine's local IP, the process depends on your OS

### Windows
1. Open the Command Prompt  
2. Execute `ipconfig`
3. Search for either `Wireless LAN adapter Wi-Fi:` or `Ethernet adapter Ethernet:` depending on your method of connection.  
4. Search for an entry that looks like the one of the following:  
`IPv4 Address. . . . . . . . . . . : 192.168.X.X`  
`IPv4 Address. . . . . . . . . . . : 10.X.X.X`

### Mac  
1. Click the Apple icon in the top-left corner  
2. Click on `System Preferences` or `System Settings`  
3. Click `Network` on the sidebar  
4. Select your active connection  
5. Click **Details** next to your current connection  

### Linux  
1. Open the terminal  
2. Execute `ip a` or `ifconfig`  
3. Look for `inet` followed by an IP address. This is your local IP address.


# How To Run

`npm run dev`  
`npm run build`  
`npm run test`  
`npm run preview`   

# Docker

`docker compose up --build`

Frontend: `http://localhost:8080`  
Backend: `http://localhost:3000`

# How To Test
`npm run test`  
