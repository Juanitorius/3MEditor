/*
 * Copyright 2014-2016 Institute of Computer Science,
 * Foundation for Research and Technology - Hellas
 *
 * Licensed under the EUPL, Version 1.1 or - as soon they will be approved
 * by the European Commission - subsequent versions of the EUPL (the "Licence");
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 *
 * http://ec.europa.eu/idabc/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and limitations
 * under the Licence.
 *
 * Contact:  POBox 1385, Heraklio Crete, GR-700 13 GREECE
 * Tel:+30-2810-391632
 * Fax: +30-2810-391638
 * E-mail: isl@ics.forth.gr
 * http://www.ics.forth.gr/isl
 *
 * Authors : Georgios Samaritakis, Konstantina Konsolaki.
 *
 * This file is part of the 3MEditor webapp of Mapping Memory Manager project.
 */
package gr.forth.ics.isl.x3mlEditor.listener;

import gr.forth.ics.isl.Tidy;
import gr.forth.ics.isl.x3mlEditor.BasicServlet;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * Web application lifecycle listener.
 *
 * @author samarita
 */
public class SessionListener extends BasicServlet implements HttpSessionListener {

    /**
     *
     */
    public static int activesessionsNO = 0;

    /**
     *
     * @param se
     */
    @Override
    public void sessionCreated(HttpSessionEvent se) {
        HttpSession session = se.getSession();
        ++activesessionsNO;

        System.out.println("ACTIVE SESSIONS:" + activesessionsNO);
    }

    /**
     *
     * @param se
     */
    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        HttpSession session = se.getSession();

        if (activesessionsNO > 0) {
            --activesessionsNO;
        }
        System.out.println("ACTIVE SESSIONS:" + activesessionsNO);
        if (activesessionsNO == 0) {
            Tidy tidy = new Tidy(DBURI, rootCollection, DBuser, DBpassword, uploadsFolder);
            tidy.run();
        }
    }
}
