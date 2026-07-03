--[[
  Photo Delivery - Auto Export Plugin
  Inicia o monitoramento automatico.
  Toda foto NOVA que entrar no catalogo durante a captura vinculada
  sera exportada automaticamente como JPG para a pasta configurada.
]]

local LrApplication = import "LrApplication"
local LrTasks = import "LrTasks"
local LrFileUtils = import "LrFileUtils"
local LrPathUtils = import "LrPathUtils"
local LrLogger = import "LrLogger"
local LrDialogs = import "LrDialogs"
local LrDate = import "LrDate"
local LrExportSession = import "LrExportSession"
local LrPhotoList = import "LrPhotoList"

local logger = LrLogger("PhotoAutoExport")
logger:enable("print")

-- Configuracoes padrao (podem ser alteradas pelo usuario)
local exportFolder = LrPathUtils.getStandardFilePath("desktop") .. "/PhotoDelivery_exports"
local exportQuality = 90
local checkInterval = 1  -- segundos
local lastCheckTime = nil
local running = true

-- Carrega config salva
local function loadConfig()
  local prefs = LrApplication.activeCatalog():getPreferences()
  local folder = prefs:getPref("photoDeliveryExportFolder")
  if folder and folder ~= "" then
    exportFolder = folder
  end
end

-- Salva config
local function saveConfig(folder)
  local prefs = LrApplication.activeCatalog():getPreferences()
  prefs:setPref("photoDeliveryExportFolder", folder)
  exportFolder = folder
end

-- Formata timestamp para nome de arquivo unico
local function timestamp()
  return os.date("%Y%m%d_%H%M%S")
end

-- Exporta uma foto como JPG
local function exportPhoto(photo)
  local success, pathOrError = pcall(function()
    local photoName = photo:getFormattedMetadata("fileName")
    if not photoName then photoName = "photo" end
    -- Remove extensao
    photoName = string.gsub(photoName, "%.[^%.]+$", "")
    local exportName = photoName .. "_" .. timestamp() .. ".jpg"
    local exportPath = LrPathUtils.child(exportFolder, exportName)

    -- Usa LrExportSession para exportar
    local session = LrExportSession({
      photosToExport = LrPhotoList({ photo }),
      exportSettings = {
        LR_export_destinationPathSuffix = exportPath,
        LR_export_outputFormat = "JPEG",
        LR_export_jpegQuality = exportQuality,
        LR_export_useSubfolder = false,
        LR_export_outputMode = "oneFilePerPhoto",
        LR_export_colorSpace = "sRGB",
        LR_tokens = {},
      },
    })
    session:doExport()
    return exportPath
  end)

  if success then
    logger:info("Exportado: " .. pathOrError)
  else
    logger:error("Falha ao exportar: " .. tostring(pathOrError))
  end
end

-- Verifica fotos novas desde a ultima checagem
local function checkNewPhotos()
  local catalog = LrApplication.activeCatalog()
  local photos = catalog:getAllPhotos()

  local checkTime = LrDate.currentTime()
  local newPhotos = {}

  for i = 1, photos:count() do
    local photo = photos[i]
    local captureTime = photo:getRawMetadata("dateCreated")
    if captureTime then
      local captureTimestamp = LrDate.timeToTimestamp(captureTime)
      if lastCheckTime == nil or captureTimestamp > lastCheckTime then
        table.insert(newPhotos, photo)
      end
    end
  end

  lastCheckTime = checkTime

  if #newPhotos > 0 then
    logger:info("Encontradas " .. #newPhotos .. " novas fotos")
    for _, photo in ipairs(newPhotos) do
      exportPhoto(photo)
    end
  end
end

-- Loop principal
local function mainLoop()
  loadConfig()

  LrDialogs.message("Photo Delivery Auto Export",
    "Monitoramento iniciado!\n\n" ..
    "Toda foto nova capturada sera exportada automaticamente.\n" ..
    "Pasta de destino: " .. exportFolder .. "\n\n" ..
    "Va em Biblioteca > Photo Delivery para parar.",
    "info"
  )

  LrTasks.startAsyncTask(function()
    while running do
      LrTasks.sleep(checkInterval)
      pcall(checkNewPhotos)
    end
  end)
end

mainLoop()
