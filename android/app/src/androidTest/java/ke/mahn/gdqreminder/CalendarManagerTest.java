package ke.mahn.gdqreminder;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class CalendarManagerTest {
    @Test
    public void InsertCalendarIfMissingReturnsPositiveInteger() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        long calendarID = CalendarManager.InsertCalendarIfMissing(appContext);
        assertTrue(calendarID > 0);

        assertEquals("ke.mahn.gdqreminder", appContext.getPackageName());
    }

    @Test
    public void InsertCalendarIfMissingReturnsNegativeInteger() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        long calendarID = CalendarManager.InsertCalendarIfMissing(appContext);
        assertTrue(calendarID < 0);

        assertEquals("ke.mahn.gdqreminder", appContext.getPackageName());
    }
}
