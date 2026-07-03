--[[
  Photo Delivery - Para o Auto Export
]]

local LrDialogs = import "LrDialogs"

-- Nota: a variavel 'running' do AutoExport.lua precisa ser setada como false.
-- No SDK do Lightroom, cada script roda em contexto separado.
-- A forma mais confiavel de parar e fechar/reabrir o plugin ou reiniciar o Lightroom.

LrDialogs.message("Photo Delivery Auto Export",
  "Para parar completamente o monitoramento, reinicie o Lightroom Classic.\n\n" ..
  "Ou va em Arquivo > Plugins > Desabilitar 'Photo Delivery - Auto Export'.",
  "info"
)
