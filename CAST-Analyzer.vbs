' CAST Database Analyzer Launcher
' This creates a standalone window for the analyzer

Set objShell = CreateObject("Shell.Application")
Set objIE = CreateObject("InternetExplorer.Application")

' Configure the window
objIE.Visible = True
objIE.ToolBar = False
objIE.StatusBar = False
objIE.MenuBar = False
objIE.AddressBar = False
objIE.Resizable = True
objIE.Width = 1400
objIE.Height = 900

' Center the window
objIE.Left = (objIE.Document.parentWindow.screen.Width - objIE.Width) / 2
objIE.Top = (objIE.Document.parentWindow.screen.Height - objIE.Height) / 2

' Get the directory of this script
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strHTML = strPath & "\simple-frontend.html"

' Navigate to the HTML file
objIE.Navigate "file:///" & strHTML

' Wait for it to load
Do While objIE.Busy Or objIE.ReadyState <> 4
    WScript.Sleep 100
Loop

' Change the title
objIE.Document.Title = "CAST Database Analyzer"

' Keep the script running
Do While objIE.Visible
    WScript.Sleep 100
Loop