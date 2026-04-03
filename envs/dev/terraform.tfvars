project_name = "SentimentAnalysisProject"
environment  = "dev"
location     = "eastus2"


enable_event_hubs        = true
enable_private_endpoints = false

tenant_id = "90eaa9ce-a4c6-4553-8288-ea9e6d0575f6"


kv_name                     = "sentanalysis-kv33"
ai_language_key_secret_name = "ai-language-key-dev"

sqlcon_secret_name = "sql-conn-dev"