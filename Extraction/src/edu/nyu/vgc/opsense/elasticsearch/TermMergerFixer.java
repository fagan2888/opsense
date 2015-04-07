package edu.nyu.vgc.opsense.elasticsearch;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public class TermMergerFixer extends Fixer {

    @Override
    public JsonObject fix(JsonObject object) {
        JsonArray terms = getElement(object, "terms").getAsJsonArray();
        terms.forEach((JsonElement t) -> {
            try{
                JsonObject g = t.getAsJsonObject().get("g").getAsJsonObject();
                JsonObject d = t.getAsJsonObject().get("d").getAsJsonObject();
                
                if(g.get("tg").getAsString().length() > 1 && d.get("tg").getAsString().length() > 1){
                    if(g.get("tg").getAsString().compareTo(d.get("tg").getAsString()) > 0 )
                    {
                        t.getAsJsonObject().addProperty("tKey", d.get("tg").getAsString().substring(0,2) + " " + g.get("tg").getAsString().substring(0,2));
                        t.getAsJsonObject().addProperty("key", d.get("lm").getAsString()+ " " + g.get("lm").getAsString());
                    }
                    else if(g.get("tg").getAsString().compareTo(d.get("tg").getAsString()) < 0 )
                    {
                        t.getAsJsonObject().addProperty("tKey", g.get("tg").getAsString().substring(0,2) + " " + d.get("tg").getAsString().substring(0,2));
                        t.getAsJsonObject().addProperty("key", g.get("lm").getAsString() + " " + d.get("lm").getAsString());
                    }
                    else 
                    { 
                        t.getAsJsonObject().addProperty("tKey", g.get("tg").getAsString().substring(0,2) + " " + d.get("tg").getAsString().substring(0,2));
                        t.getAsJsonObject().addProperty("key", d.get("lm").getAsString() + " " + g.get("lm").getAsString());
                    }
                }
            } catch (Exception e){
                e.printStackTrace();
                System.out.println(t);
                throw e;
            }
        });
        return object;
    }

    @Override
    public String getId(JsonObject object) {
        return getElement(object, "document.id").getAsString();
    }
    
}
