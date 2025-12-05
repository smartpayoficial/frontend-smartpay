// Define el script como una función que acepta el STORE_ID como argumento
const createWindowsBatchScript = (enrollmentCodeValue, storeIdValue) => `@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Archivos de configuracion
set PKG="com.appincdevs.smartpaytv"
set STORE_ID="${storeIdValue}"
set ENROLLMENT_CODE="${enrollmentCodeValue}"
set APK_FILE="./smartpayTv.apk"  :: Asume que el APK está en la misma carpeta

echo Codigo de Enrolamiento: %ENROLLMENT_CODE%
echo ---

:: Variable para manejar saltos de línea y formateo
set NLM=^
set NL=^^^%NLM%%NLM%^%NLM%%NLM%

echo Buscando dispositivos...
set DEVICE_COUNT=0

FOR /F "tokens=1,2 skip=1" %%A IN ('adb devices') DO (
    SET IS_DEV=%%B
    if "!IS_DEV!" == "device" (
        SET SERIAL=%%A
        set /a DEVICE_COUNT+=1
        
        echo %NL%#### PROCESS START FOR SERIAL ## !SERIAL! ####%NL%
        
        echo * Instalando SmartPay Application *
        adb -s !SERIAL! install -r -g !APK_FILE!
        
        echo * Configurando SmartPay Application como Device Owner *
        adb -s !SERIAL! shell dpm set-device-owner !PKG!/com.appincdevs.smartpaytv.receivers.SmartPayDeviceAdminReceiver
        
        if errorlevel 1 (
            echo Device owner command failed.
        ) else (
            echo Device owner command was successful.
        )
        
        :: VERIFICACIÓN DEL DEVICE OWNER
        for /f "tokens=*" %%i in ('adb -s !SERIAL! shell dumpsys device_policy ^| findstr /c:"package=" 2^>nul') do set DEVICE_OWNER_LINE=%%i

        echo !DEVICE_OWNER_LINE! | findstr /c:!PKG! >nul
        if errorlevel 1 (
            echo Package !PKG! is not the device owner or no device owner is set. Fix the error and try again.
            exit /b 1
        ) else (
            echo Package !PKG! is the device owner.
        )

        echo %NL%* Otorgando Permisos *
        adb -s !SERIAL! shell appops set !PKG! WRITE_SETTINGS allow
        adb -s !SERIAL! shell appops set !PKG! RUN_IN_BACKGROUND allow
        adb -s !SERIAL! shell appops set !PKG! RUN_ANY_IN_BACKGROUND allow
        adb -s !SERIAL! shell appops set !PKG! READ_DEVICE_IDENTIFIERS allow
        adb -s !SERIAL! shell appops set !PKG! SYSTEM_ALERT_WINDOW allow
        adb -s !SERIAL! shell dumpsys deviceidle whitelist +!PKG!
        adb -s !SERIAL! shell appops set !PKG! REQUEST_INSTALL_PACKAGES allow
        
        echo %NL%* Iniciando Actividad Launcher *
        adb -s !SERIAL! shell am start -n !PKG!/com.appincdevs.smartpaytv.ui.views.policyCompliance.PolicyComplianceActivity --es "ENROLLMENT_ID" "%ENROLLMENT_CODE%" --es "STORE_ID" "%STORE_ID%"

        echo %NL%#### PROCESS END FOR SERIAL ## !SERIAL! #### %NL%
    )
)

if %DEVICE_COUNT% == 0 (
    echo No devices found.
)

ENDLOCAL`;

export default createWindowsBatchScript;