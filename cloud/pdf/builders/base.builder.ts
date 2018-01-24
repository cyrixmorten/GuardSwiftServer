import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {ReportSettings} from "../../../shared/subclass/ReportSettings";
import {Report} from "../../../shared/subclass/Report";


export interface IReportBuilder {
    generate(): Object;
}

export class BaseReportBuilder implements IReportBuilder{

    private reportDefinition = {};

    constructor(protected report: Report, protected settings: ReportSettings, protected timeZone: string) {

        this.write({
            pageMargins: [40, 60, 40, 60]
        })

    }

    protected write(object: Object) {
        _.assignIn(this.reportDefinition, object);
    }


    // TODO translate
    header(): BaseReportBuilder {
        this.write({
            header: {
                columns: [
                    {
                        width: 'auto',
                        text: [{text: 'Vagt: ', bold: true}, this.report.guardName]
                    },
                    {
                        width: '*',
                        text: 'Dato: ' + moment(this.report.createdAt).tz(this.timeZone).format('DD-MM-YYYY'),
                        alignment: 'right'
                    }
                ],
                margin: [10, 10]
            }
        });

        return this;
    }


    background(): BaseReportBuilder {
        let headerLogo = this.settings.headerLogo;

        if (headerLogo) {
            let result = <any>{};

            if (headerLogo.datauri) {
                result = {
                    image: headerLogo.datauri,
                    margin: [15, 60, 15, 0]
                }
            }

            /** defaults **/
            result.alignment = "center";


            if (headerLogo.alignment) {
                result.alignment = headerLogo.alignment;
            }

            if (headerLogo.stretch) {
                // make image take up full width
                result.width = (21 / 2.54) * 72 - (2 * 40); // (cm / 2.54) * dpi - margin
            }
            else {
                if (headerLogo.width) {
                    result.width = headerLogo.width
                }


                if (headerLogo.height) {
                    result.height = headerLogo.height
                }

                // if neither height or width is specified, set width to 3cm
                // from pdfmake: if you specify width, image will scale proportionally
                if (!headerLogo.width && !headerLogo.height) {
                    result.width = (3 / 2.54) * 72;
                }
            }

            this.write({
                background: result
            });
        }


        return this;
    }




    content(): BaseReportBuilder {
        return this;
    }


    // TODO: Hardcoded, read from reportSettings
    footer(): BaseReportBuilder {
        this.write({
            footer: [
                {text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 10 49 50', alignment: 'center'},
                {
                    text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
                    alignment: 'center'
                }
            ]
        });

        return this;
    }

    styles(): BaseReportBuilder {
        this.write({
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 16,
                    color: 'grey'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 11,
                    color: 'black'
                },
                boldFont: {
                    bold: true
                }
            }
        });

        return this;
    }

    build = (): Object => this.reportDefinition;

    generate(): Object {
        return this.header()
            .background()
            .content()
            .footer()
            .styles()
            .build();
    }

}





