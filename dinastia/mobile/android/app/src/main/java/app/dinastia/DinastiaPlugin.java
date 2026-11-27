package app.dinastia;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Primeste din pagina rezumatul jocului si il pune la dispozitia widget-ului. */
@CapacitorPlugin(name = "Dinastia")
public class DinastiaPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        SharedPreferences sp = getContext().getSharedPreferences(DinastiaWidget.PREFS, Context.MODE_PRIVATE);
        sp.edit()
            .putString("rank", call.getString("rank", ""))
            .putInt("score", call.getInt("score", 0))
            .putString("next", call.getString("next", ""))
            .putString("closes", call.getString("closes", ""))
            .putBoolean("risk", Boolean.TRUE.equals(call.getBoolean("risk", false)))
            .putLong("updated", System.currentTimeMillis())
            .apply();
        DinastiaWidget.refreshAll(getContext());
        call.resolve();
    }
}
