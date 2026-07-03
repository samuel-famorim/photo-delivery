--[[
  Photo Delivery - Export Service Provider
  Fornece um preset de exportacao que pode ser usado nas configuracoes
]]

return {
  hideSections = { "exportLocation", "fileNaming", "video" },
  allowFileFormatChange = false,
  allowColorSpaceChange = true,

  defaultSettings = {
    LR_export_outputFormat = "JPEG",
    LR_export_jpegQuality = 90,
    LR_export_colorSpace = "sRGB",
    LR_export_useSubfolder = false,
    LR_export_outputMode = "oneFilePerPhoto",
    LR_size_doConstrain = true,
    LR_size_maxWidth = 2000,
    LR_size_maxHeight = 2000,
    LR_size_units = "pixels",
  },

  startDialog = function(params)
    return {
      title = "Photo Delivery JPG",
      contents = {
        { title = "Exporta JPG otimizado para o sistema Photo Delivery." },
        { title = "Qualidade: 90, sRGB, max 2000px." },
      },
    }
  end,
}
