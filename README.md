# Deployment model file locations

The backend configuration in `Deployment/backend/app/core/config.py` expects the trained model files at these paths. The files were moved from the project-root `artefacts` folders into `Deployment/artefacts` without renaming the model files.


THE MODEL file (.keras) ARE IN THE DEPLOYMENT/ARTEFACTS FOLDERS


| Model | Previous location | Current deployment location |
|---|---|---|
| CCNN | `artefacts/cnn_baseline/aptos_cnn_512_clahe.keras` | `Deployment/artefacts/cnn_baseline/aptos_cnn_512_clahe.keras` |
| EfficientNetB0 | `artefacts/EfficentNetB0/efficientnetb0_aptos_complete_model.keras` | `Deployment/artefacts/EfficientNet/efficientnetb0_aptos_complete_model.keras` |
| ResNet50 | `artefacts/ResNet50/resnet50_aptos_complete_model.keras` | `Deployment/artefacts/ResNet-20261028T212624Z-1-001/ResNet/resnet50_aptos_complete_model.keras` |

Other artefacts, including plots and EDA figures, were left in the project-root `artefacts` directory.


Install node js and python version 3.11 to run 

after running  those check for python version in cmd 
py -3.11 --version if it shows 3.11 then youre good 

after running the install go to the backend folder at deployment\frontend and open cmd and type

npm.cmd --version

if it says a version and shows a warning msg abt some left label and its name is esbuild@0.25.12 run

npm.cmd install-scripts approve esbuild

then run in cmd: 
ren Deployment\backend\.venv .venv-old
py -3.11 -m venv Deployment\backend\.venv
Deployment\backend\.venv\Scripts\python.exe -m pip install --upgrade pip
Deployment\backend\.venv\Scripts\python.exe -m pip install -r Deployment\backend\requirements.txt

if u get 'ERR_MODULE_NOT_FOUND', run this in the deploymet/frontend


npm.cmd install-scripts approve esbuild
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5173

if it says ready then you can close the cmds and just open the start_project app

EXTRAs:
The clinical API is currently unavailable
Failed to load models metadata. Confirm that FastAPI is running on port 8000.

if u get this error wait for a bit then refresh the site 