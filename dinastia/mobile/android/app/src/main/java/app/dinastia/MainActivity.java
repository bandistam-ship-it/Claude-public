package app.dinastia;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DinastiaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
