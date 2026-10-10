package br.com.doramastudio.ai;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

/** User-selected export location. No storage permissions or public data uploads. */
@CapacitorPlugin(name = "DoramaFiles")
public class DoramaFilesPlugin extends Plugin {
    @PluginMethod
    public void exportFile(PluginCall call) {
        String name = call.getString("name");
        String base64 = call.getString("base64");
        if (name == null || base64 == null || base64.length() > 72 * 1024 * 1024) {
            call.reject("Arquivo inválido ou acima do limite de exportação (50 MB).");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(call.getString("mime", "application/octet-stream").split(";")[0]);
        intent.putExtra(Intent.EXTRA_TITLE, name.replaceAll("[/\\\\]", "_"));
        startActivityForResult(call, intent, "fileChosen");
    }

    @ActivityCallback
    private void fileChosen(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Exportação cancelada.");
            return;
        }
        try (OutputStream output = getContext().getContentResolver().openOutputStream(result.getData().getData())) {
            if (output == null) throw new IllegalStateException("Destino indisponível.");
            output.write(Base64.decode(call.getString("base64"), Base64.DEFAULT));
            output.flush();
            JSObject response = new JSObject();
            response.put("saved", true);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Não foi possível salvar o arquivo.", error);
        }
    }
}
