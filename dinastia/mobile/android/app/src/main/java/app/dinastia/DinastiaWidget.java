package app.dinastia;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget pentru ecranul principal: rang, scorul saptamanii si urmatoarea cucerire. */
public class DinastiaWidget extends AppWidgetProvider {
    static final String PREFS = "dinastia";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, DinastiaWidget.class));
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    static RemoteViews build(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_dinastia);
        long updated = sp.getLong("updated", 0);
        if (updated == 0) {
            v.setTextViewText(R.id.w_rank, "Dinastia ta");
            v.setTextViewText(R.id.w_score, "");
            v.setTextViewText(R.id.w_next, "Deschide aplicația o dată ca să apară datele.");
            v.setTextViewText(R.id.w_foot, "");
        } else {
            v.setTextViewText(R.id.w_rank, sp.getString("rank", ""));
            v.setTextViewText(R.id.w_score, "Scor săptămână: " + sp.getInt("score", 0) + "/10");
            String next = sp.getString("next", "");
            if (sp.getBoolean("risk", false)) next = "⚠ Teritoriu în pericol. " + next;
            v.setTextViewText(R.id.w_next, next);
            String when = new SimpleDateFormat("d MMM, HH:mm", new Locale("ro")).format(new Date(updated));
            v.setTextViewText(R.id.w_foot, "Actualizat " + when + " · " + sp.getString("closes", ""));
        }
        Intent open = new Intent(context, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(context, 0, open, flags));
        return v;
    }
}
