return {
  LrSdkVersion = 12.0,
  LrSdkMinimumVersion = 6.0,
  LrToolkitIdentifier = "com.photodelivery.autoexport",
  LrPluginName = "Photo Delivery - Auto Export",
  LrLibraryMenuItems = {
    {
      title = "Auto Export: Iniciar",
      file = "AutoExport.lua",
    },
    {
      title = "Auto Export: Parar",
      file = "StopExport.lua",
    },
    {
      title = "Auto Export: Configurar Pasta",
      file = "ConfigExport.lua",
    },
  },
  LrExportServiceProvider = {
    title = "Photo Delivery JPG",
    file = "ExportService.lua",
  },
  LrPluginInfoUrl = "http://localhost:3000",
  LrPluginId = "821AF7E2-C42E-49FC-BE4A-3FA2F5A13F8B",
}
