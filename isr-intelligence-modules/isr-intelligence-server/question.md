# karşılıklı tartışma

Design and implementationı okudun


Ben IntelligenceService sınıfında Intelligence entitysinin crdu işlemlerini ve query işlemlerini yapmak istiyorum

Bu entity i hem solra hem postgresql kaydetmek istiyrum çünkü solr da acid yani transaction olmadığı için ama keyword ve facete search yeteneği oldugu için
veriyi iki tarafa kaydedeccceğim ama source of truth kısmı postgresql olacak

   saveIntelligence
       postgresql e kaydet
       outbox pattern ile dinle ve solra da kayıt yap
   updateIntelligence
       postgresql de kaydı güncelle
       outbox pattern ile dinle ve solrda da güncelleme yap
   deleteIntelligence
       postgresqlden sil
       outbox pattern ile dinle ve solrdan da sil
   getIntelligenceById
       id ye göre tüm intelligence postgresqlden getirmeli(güvenilir kaynak postgre oldugu için)
   getIntelligenceByTemplateId(templateId,lastQueryTime)
         templateId ye göre tüm intelligenceları postgresqlden getirmeli(güvenilir kaynak postgre oldugu için)
         eger lastQueryTime var ise bu sorgu da eklenerek bir önceki sorgudan sonra yaratılan veya güncellenen Intelligence
         varsa sadece o intelligence lar gelmeli

   getIntelligenceByQuery(List<Query> query)
      query alanı içerisinde query field olarak inteligence static alanlarını ve 
      attributeIdToAttributeValueMap deki dinamik Attribute id lerini içerececek ve query value olarak da static alanla için o alan değerindeki
      dinamik alanlar için de AttributeType e göre değer içerecek sorgular içerecek

yani 

GET	/api/intelligence?templateId=X&lastQueryTime=Y	PostgreSQL (jOOQ streaming)	delta sync — full snapshot if Y absent, otherwise last_modified > Y
GET	/api/intelligence/{id}	PostgreSQL (jOOQ)	by id
POST	/api/intelligence	PostgreSQL + outbox -> Solr	create
PUT	/api/intelligence/{id}	PostgreSQL + outbox -> Solr	update
DELETE	/api/intelligence/{id}	PostgreSQL + outbox -> Solr	soft delete

şimdi bu servisde intelligence cachei tutmam bu servisin scalable olması ve bakımının kolay olması için getiriden cok zararı olabilir gibi
Bana her bir uca cache eklerken kazanacaklarımız ve kaybedeceklerimizi listele tartışalım


7.3 API endpoint summary (MVP)

GET	/api/intelligence?templateId=X&lastQueryTime=Y	PostgreSQL (jOOQ streaming)	delta sync — full snapshot if Y absent, otherwise last_modified > Y
GET	/api/intelligence/{id}	PostgreSQL (jOOQ)	by id
POST	/api/intelligence	PostgreSQL + outbox -> Solr	create
PUT	/api/intelligence/{id}	PostgreSQL + outbox -> Solr	update
DELETE	/api/intelligence/{id}	PostgreSQL + outbox -> Solr	soft delete
GET	/api/intelligence/search?q=...&template=...	Solr (SolrJ)	full-text
GET	/api/intelligence/search/facets?template=...	Solr	faceted aggregation
POST	/api/intelligence/combined-search	Solr + PostGIS parallel -> id intersection -> PG	section 6.3
POST	/api/intelligence/within-polygon	PG + PostGIS (jOOQ)	ST_Contains, body=WKT
GET	/api/intelligence/near?lat=..&lon=..&km=..	PG + PostGIS (jOOQ)	ST_DWithin
GET	/api/templates	PostgreSQL	list all templates
GET	/api/templates/{id}/attributes	PostgreSQL	attributes for a template
GET	/actuator/health	actuator	PG + Solr health

bu matrix implemente edildi ama tartışalım

GET	/api/intelligence/search?q=...&template=...	Solr (SolrJ)	full-text

solr bizim güvenilir veri kaynağımız değil ama full text search ile solrdan veri cekiyoruz ama ya acid olmadığı için veriler corruptsa, sanki bizim aramayı solr


SearchQuery
    List<QueryHolder> queryHolder
    int page
    int row
    String sortField
    boolean sortAsc
    String q; //yalnızca free text alacak(q:*Terör*) (q:header:test) değil bu şekilde alan ismi almayacak

QueryHolder
     String queryFieldName
     Object queryFieldValue
     QueryOperator  queryOperator
     QueryOperand   queryOperand
     List<QueryHolder> nestedQueries;
     


QueryOperator 
  EQUALS,RANGE,SMALLER_THAN,BIGGER_THAN,GEO_WITHIN_GEO_CONTAINS etc
QueryOperand
  AND,OR

   
     


---