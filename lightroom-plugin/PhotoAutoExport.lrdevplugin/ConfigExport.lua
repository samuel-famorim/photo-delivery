--[[
  Photo Delivery - Configurar Pasta de Exportacao
]]

local LrDialogs = import "LrDialogs"
local LrPathUtils = import "LrPathUtils"
local LrApplication = import "LrApplication"

-- Pasta padrao: pasta _incoming do sistema
local defaultFolder = nil
local homeFolder = LrPathUtils.getStandardFilePath("home")

-- Tenta achar a pasta do projeto
local possiblePaths = {
  homeFolder .. "/Downloads/free-claude-code-main/documents/Projetos/photo-delivery/backend/uploads/_incoming",
  homeFolder .. "/Documents/photo-delivery/backend/uploads/_incoming",
}

for _, path in ipairs(possiblePaths) do
  local exists = pcall(function() return LrPathUtils.exists(path) end)
  if exists then
    defaultFolder = path
    break
  end
end

if not defaultFolder then
  defaultFolder = LrPathUtils.getStandardFilePath("desktop") .. "/PhotoDelivery_exports"
end

-- Le config atual
local prefs = LrApplication.activeCatalog():getPreferences()
local currentFolder = prefs:getPref("photoDeliveryExportFolder") or defaultFolder

-- Dialog para escolher pasta
local result = LrDialogs.presentModalDialog({
  title = "Pasta de Exportacao Automatica",
  contents = {
    { title = "Pasta onde os JPGs serao salvos:" },
    { bind_to_object = "folder", type = "edit_field", value = currentFolder, width_in_chars = 60 },
    { title = "" },
    { title = "Dica: Selecione a pasta '_incoming' do sistema Photo Delivery.", text_color = "gray" },
  },
  buttons = { "ok", "cancel" },
  defaultButton = "ok",
})

if result == "ok" then
  local newFolder = result.folder
  if newFolder and newFolder ~= "" then
    -- Garante que a pasta existe
    local success, err = pcall(function()
      LrPathUtils.makeDirectory(newFolder)
    end)
    if not success then
      -- Tenta criar com mkdir via comando
      LrPathUtils.makeDirectory(newFolder)
    end

    prefs:setPref("photoDeliveryExportFolder", newFolder)
    LrDialogs.message("Configurado!",
      "Pasta de exportacao: " .. newFolder .. "\n\n" ..
      "Reinicie o Auto Export para aplicar a nova configuracao.",
      "info"
    )
  end
end
