project_name = "SentimentAnalysisProject"
environment  = "dev"
location     = "eastus2"


enable_event_hubs        = true
enable_private_endpoints = false

tenant_id                  = "90eaa9ce-a4c6-4553-8288-ea9e6d0575f6"
sql_admins_group_name      = "sql-admins-sentiment"
sql_admins_group_object_id = "3aaa44d7-c394-446d-9e06-cc323bcab4c1"

kv_name                     = "sentanalysis-kv33"
ai_language_key_secret_name = "ai-language-key-dev"

sqlcon_secret_name = "sql-conn-dev"

publisher_name   = "Malcolm Warren"
publisher_email  = "bowvase@gmail.com"
apim_sku_name    = "Developer_1"
api_path         = "sentiment"
backend_url      = "http://functapp-dev-sentimentanalysisproject.azurewebsites.net/api"
api_display_name = "Sentiment Analysis API"